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
  Users, 
  Briefcase, 
  Calendar,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import ENDPOINTS from '@/lib/endpoint';
import { isValidEmail, isValidPhone, normalizeEmail } from '@/lib/validation';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  experience: string;
  currentCompany: string;
  expectedSalary: string;
  noticePeriod: string;
  skills: string;
  resumeUrl: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  appliedDate: string;
  notes: string;
  source: string;
}

const HRRecruitment: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    experience: '',
    currentCompany: '',
    expectedSalary: '',
    noticePeriod: '',
    skills: '',
    resumeUrl: '',
    source: '',
    appliedDate: '',
    status: 'applied' as const,
    notes: '',
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || statusFilter !== 'all') {
        fetchCandidates();
      }
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const result = await ENDPOINTS.fetchCandidates(params);
      if (result.data) {
        setCandidates(result.data.map((candidate: any) => ({
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          department: candidate.department,
          experience: candidate.experience,
          status: candidate.status,
          appliedDate: candidate.applied_date ? new Date(candidate.applied_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          source: candidate.source || '',
          currentCompany: candidate.current_company || '',
          expectedSalary: candidate.expected_salary || '',
          noticePeriod: candidate.notice_period || '',
          skills: candidate.skills || '',
          resumeUrl: candidate.resume_url || '',
          notes: candidate.notes || ''
        })));
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-gray-100 text-gray-800';
      case 'screening': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'offer': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Phone number must be 10 digits and start with 6, 7, 8, or 9');
      return;
    }

    try {
      setSubmitting(true);
      const result = await ENDPOINTS.addCandidate({
        ...formData,
        email: normalizeEmail(formData.email),
        phone: formData.phone.trim(),
      });
      if (result.data) {
        // Refresh the candidate list from server to get the latest data
        await fetchCandidates();
        setFormData({
          name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          experience: '',
          currentCompany: '',
          expectedSalary: '',
          noticePeriod: '',
          skills: '',
          resumeUrl: '',
          source: '',
          appliedDate: '',
          status: 'applied' as const,
          notes: '',
        });
        setIsDialogOpen(false);
      } else {
        setError(result.error || 'Failed to create candidate');
      }
    } catch (err) {
      setError('Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setError(null);

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Phone number must be 10 digits and start with 6, 7, 8, or 9');
      return;
    }
    
    try {
      setSubmitting(true);
      const result = await ENDPOINTS.editCandidate(selectedCandidate.id, {
        ...formData,
        email: normalizeEmail(formData.email),
        phone: formData.phone.trim(),
      });
      if (result.data) {
        // Refresh the candidate list from server to get the latest data
        await fetchCandidates();
        setFormData({
          name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          experience: '',
          currentCompany: '',
          expectedSalary: '',
          noticePeriod: '',
          skills: '',
          resumeUrl: '',
          source: '',
          appliedDate: '',
          status: 'applied' as const,
          notes: '',
        });
        setIsEditDialogOpen(false);
        setSelectedCandidate(null);
      } else {
        setError(result.error || 'Failed to update candidate');
      }
    } catch (err) {
      setError('Failed to update candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      department: candidate.department,
      experience: candidate.experience,
      currentCompany: candidate.currentCompany,
      expectedSalary: candidate.expectedSalary,
      noticePeriod: candidate.noticePeriod,
      skills: candidate.skills,
      resumeUrl: candidate.resumeUrl,
      source: candidate.source,
      appliedDate: candidate.appliedDate,
      status: candidate.status,
      notes: candidate.notes,
    });
    setIsEditDialogOpen(true);
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = (candidate.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (candidate.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (candidate.position?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">Recruitment Management</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage job applications and recruitment process</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '-' : candidates.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
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
                <Label htmlFor="search">Search Candidates</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email, or position..."
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
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Candidates</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading candidates...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No candidates found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                        <p className="text-sm text-gray-600 mt-1">{candidate.position}</p>
                        <p className="text-xs text-gray-500">{candidate.department}</p>
                      </div>
                      <Badge className={`${getStatusColor(candidate.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                        {candidate.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Experience</span>
                        <span className="text-sm text-gray-900">{candidate.experience}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Applied</span>
                        <span className="text-sm text-gray-900">{candidate.appliedDate}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Source</span>
                        <span className="text-sm text-gray-900">{candidate.source}</span>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(candidate)}
                          className="h-8 w-8 p-0"
                        >
                          ✏️
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
                    <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</TableHead>
                    <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{candidate.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">{candidate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{candidate.position}</div>
                          <div className="text-sm text-gray-500 mt-1">{candidate.department}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <Badge className={`${getStatusColor(candidate.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(candidate)}
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          >
                            ✏️
                          </Button>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      required
                    />
                  </div>
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
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input
                      id="currentCompany"
                      value={formData.currentCompany}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                      placeholder="Current company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedSalary">Expected Salary</Label>
                    <Input
                      id="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      placeholder="e.g., Rs.50,000 - Rs.70,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="noticePeriod">Notice Period</Label>
                    <Input
                      id="noticePeriod"
                      value={formData.noticePeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                      placeholder="e.g., 2 weeks, 1 month"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appliedDate">Applied Date</Label>
                    <Input
                      id="appliedDate"
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., LinkedIn, Indeed, Referral"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="resumeUrl">Resume URL</Label>
                  <Input
                    id="resumeUrl"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                    placeholder="Link to resume or portfolio"
                  />
                </div>
              </div>

              {/* Extended Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Extended Information</h3>
                
                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="List key skills separated by commas (e.g., JavaScript, React, Node.js, Python)"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about candidate, interview feedback, or other relevant information"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Candidate...
                    </>
                  ) : (
                    'Add Candidate'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Candidate Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={() => setIsEditDialogOpen(false)}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Candidate - {selectedCandidate?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-position">Position</Label>
                    <Input
                      id="edit-position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-department">Department</Label>
                    <Input
                      id="edit-department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-experience">Experience</Label>
                    <Input
                      id="edit-experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Status</h3>
                <div>
                  <Label htmlFor="edit-status">Application Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Professional Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="edit-currentCompany">Current Company</Label>
                    <Input
                      id="edit-currentCompany"
                      value={formData.currentCompany}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                      placeholder="Current company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-expectedSalary">Expected Salary</Label>
                    <Input
                      id="edit-expectedSalary"
                      value={formData.expectedSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      placeholder="e.g., Rs.50,000 - Rs.70,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-noticePeriod">Notice Period</Label>
                    <Input
                      id="edit-noticePeriod"
                      value={formData.noticePeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                      placeholder="e.g., 2 weeks, 1 month"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-appliedDate">Applied Date</Label>
                    <Input
                      id="edit-appliedDate"
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="edit-source">Source</Label>
                    <Input
                      id="edit-source"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., LinkedIn, Indeed, Referral"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-resumeUrl">Resume URL</Label>
                  <Input
                    id="edit-resumeUrl"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                    placeholder="Link to resume or portfolio"
                  />
                </div>
              </div>

              {/* Extended Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Extended Information</h3>
                
                <div>
                  <Label htmlFor="edit-skills">Skills</Label>
                  <textarea
                    id="edit-skills"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="List key skills separated by commas (e.g., JavaScript, React, Node.js, Python)"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about candidate, interview feedback, or other relevant information"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Candidate...
                    </>
                  ) : (
                    'Update Candidate'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default HRRecruitment;
