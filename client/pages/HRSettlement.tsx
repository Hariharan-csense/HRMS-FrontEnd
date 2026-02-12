import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Search, Plus, Edit, Eye, Download, Calculator, DollarSign, Calendar, User, FileText, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ENDPOINTS from '@/lib/endpoint';

interface Settlement {
  id: number;
  employee_name: string;
  employee_id: string;
  department: string;
  designation: string;
  resignation_date: string;
  last_working_day: string;
  settlement_date?: string;
  status: 'pending' | 'processing' | 'calculated' | 'completed' | 'rejected';
  total_earnings: number;
  total_deductions: number;
  net_amount: number;
  payment_mode?: string;
  payment_reference?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

interface SettlementComponent {
  id: number;
  settlement_id: number;
  name: string;
  type: 'earning' | 'deduction';
  amount: number;
  is_taxable: boolean;
  description?: string;
  created_at: string;
}

interface SettlementDocument {
  id: number;
  settlement_id: number;
  document_name: string;
  file_path: string;
  created_at: string;
}

const HRSettlement: React.FC = () => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [selectedSettlementComponents, setSelectedSettlementComponents] = useState<SettlementComponent[]>([]);
  const [selectedSettlementDocuments, setSelectedSettlementDocuments] = useState<SettlementDocument[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    resignationDate: '',
    lastWorkingDay: '',
    paymentMode: '',
    remarks: ''
  });

  // Fetch settlements and employees from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settlementsResponse, employeesResponse] = await Promise.all([
          ENDPOINTS.getSettlements(),
          ENDPOINTS.getEmployeesForSettlement()
        ]);
        
        setSettlements(settlementsResponse.data.settlements || []);
        setEmployees(employeesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load settlement data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSettlements = settlements.filter(settlement => {
    const matchesSearch = settlement.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         settlement.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (settlement.department && settlement.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      processing: { variant: 'default', icon: <Calculator className="w-3 h-3" /> },
      calculated: { variant: 'default', icon: <DollarSign className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> }
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleCreateSettlement = async () => {
    try {
      const response = await ENDPOINTS.createSettlement({
        employeeId: formData.employeeId,
        resignationDate: formData.resignationDate,
        lastWorkingDay: formData.lastWorkingDay,
        remarks: formData.remarks
      });

      const newSettlement = response.data;
      setSettlements([newSettlement, ...settlements]);
      setIsCreateDialogOpen(false);
      setFormData({ employeeId: '', resignationDate: '', lastWorkingDay: '', paymentMode: '', remarks: '' });
      toast.success('Settlement created successfully');
    } catch (error: any) {
      console.error('Error creating settlement:', error);
      toast.error(error.response?.data?.error || 'Failed to create settlement');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedSettlement) return;
    
    try {
      await ENDPOINTS.updateSettlement(selectedSettlement.id, {
        status: newStatus
      });
      
      // Update the settlement in the list
      setSettlements(prev => 
        prev.map(s => 
          s.id === selectedSettlement.id 
            ? { ...s, status: newStatus as any } 
            : s
        )
      );
      
      // Update the selected settlement
      setSelectedSettlement(prev => 
        prev ? { ...prev, status: newStatus as any } : null
      );
      
      setNewStatus('');
      toast.success('Status updated successfully');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleViewSettlement = async (settlement: Settlement) => {
    try {
      const response = await ENDPOINTS.getSettlementById(settlement.id);
      const { settlement: fullSettlement, components, documents } = response.data;
      
      setSelectedSettlement(fullSettlement);
      setSelectedSettlementComponents(components || []);
      setSelectedSettlementDocuments(documents || []);
      setNewStatus('');
      setIsViewDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching settlement details:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch settlement details');
    }
  };

  const handleCalculateSettlement = async (settlementId: number) => {
    try {
      const response = await ENDPOINTS.calculateSettlement(settlementId);
      
      // Get the updated settlement details to ensure we have the latest status
      const detailsResponse = await ENDPOINTS.getSettlementById(settlementId);
      const updatedSettlement = detailsResponse.data.settlement;
      
      // Update the settlement in the list with the latest data
      setSettlements(prevSettlements => 
        prevSettlements.map(settlement => 
          settlement.id === settlementId 
            ? { 
                ...settlement, 
                ...updatedSettlement,
                status: updatedSettlement.status || 'calculated'
              }
            : settlement
        )
      );
      
      // Update the selected settlement if it's currently open
      if (selectedSettlement?.id === settlementId) {
        setSelectedSettlement(prev => ({
          ...prev!,
          ...updatedSettlement,
          status: updatedSettlement.status || 'calculated'
        }));
        
        // Update the components from the details response
        const { components } = detailsResponse.data;
        setSelectedSettlementComponents(components || []);
      }
      
      toast.success('Settlement calculated successfully');
    } catch (error: any) {
      console.error('Error calculating settlement:', error);
      toast.error(error.response?.data?.error || 'Failed to calculate settlement');
    }
  };

  const handleDownloadSettlement = async (settlementId: number) => {
    try {
      const response = await ENDPOINTS.downloadSettlementReport(settlementId);
      
      // Create a downloadable JSON file with settlement data
      const data = response.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlement-${data.settlement.employee_id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Settlement report downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading settlement:', error);
      toast.error(error.response?.data?.error || 'Failed to download settlement report');
    }
  };

  const handleSendSettlementEmail = async (settlement: Settlement) => {
    try {
      // First get the full settlement details
      const response = await ENDPOINTS.getSettlementById(settlement.id);
      const { settlement: fullSettlement, components } = response.data;
      
      // Send email with settlement details
      await ENDPOINTS.sendSettlementEmail({
        settlementId: settlement.id,
        employeeEmail: fullSettlement.email,
        employeeName: fullSettlement.employee_name,
        netAmount: fullSettlement.net_amount,
        status: fullSettlement.status
      });
      
      toast.success('Settlement email sent successfully');
    } catch (error: any) {
      console.error('Error sending settlement email:', error);
      toast.error(error.response?.data?.error || 'Failed to send settlement email');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">F&F Settlement</h1>
          <p className="text-muted-foreground">Manage employee full and final settlements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Settlement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Settlement</DialogTitle>
              <DialogDescription>
                Create a new full and final settlement for an employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="resignationDate">Resignation Date</Label>
                <Input
                  id="resignationDate"
                  type="date"
                  value={formData.resignationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, resignationDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                <Input
                  id="lastWorkingDay"
                  type="date"
                  value={formData.lastWorkingDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter any remarks..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateSettlement} className="w-full">
                Create Settlement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by employee name, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settlements</CardTitle>
          <CardDescription>
            List of all employee full and final settlements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Working Day</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSettlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{settlement.employee_name}</div>
                      <div className="text-sm text-muted-foreground">{settlement.employee_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{settlement.department || 'N/A'}</TableCell>
                  <TableCell>{new Date(settlement.last_working_day).toLocaleDateString()}</TableCell>
                  <TableCell>{formatCurrency(settlement.net_amount)}</TableCell>
                  <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSettlement(settlement)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSettlement(settlement.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendSettlementEmail(settlement)}
                        title="Send Settlement Email"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Settlement Details</DialogTitle>
              <DialogDescription>
                Full and final settlement details for {selectedSettlement?.employee_name}
              </DialogDescription>
            </DialogHeader>
          {selectedSettlement && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="calculations">Calculations</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee Name</Label>
                    <p className="font-medium">{selectedSettlement.employee_name}</p>
                  </div>
                  <div>
                    <Label>Employee Code</Label>
                    <p className="font-medium">{selectedSettlement.employee_id}</p>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <p className="font-medium">{selectedSettlement.department || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <p className="font-medium">{selectedSettlement.designation || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Resignation Date</Label>
                    <p className="font-medium">{new Date(selectedSettlement.resignation_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Last Working Day</Label>
                    <p className="font-medium">{new Date(selectedSettlement.last_working_day).toLocaleDateString()}</p>
                  </div>
                  {selectedSettlement.settlement_date && (
                    <div>
                      <Label>Settlement Date</Label>
                      <p className="font-medium">{new Date(selectedSettlement.settlement_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedSettlement.payment_mode && (
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedSettlement.status)}
                        {selectedSettlement.status !== 'completed' && selectedSettlement.status !== 'rejected' && (
                          <div className="flex items-center gap-2 ml-4">
                            <Select 
                              value={newStatus} 
                              onValueChange={setNewStatus}
                            >
                              <SelectTrigger className="w-[150px] h-8">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="calculated">Calculated</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm"
                              onClick={handleStatusUpdate}
                              disabled={!newStatus || newStatus === selectedSettlement.status}
                            >
                              Update
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedSettlement.remarks && (
                  <div>
                    <Label>Remarks</Label>
                    <p className="text-sm text-muted-foreground">{selectedSettlement.remarks}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="calculations" className="space-y-4">
                {selectedSettlement.status === 'pending' ? (
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      Click "Calculate Settlement" to process the settlement calculations.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Earnings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedSettlementComponents
                          .filter(comp => comp.type === 'earning')
                          .map((component, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{component.name}</span>
                              <span>{formatCurrency(component.amount)}</span>
                            </div>
                          ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Earnings</span>
                          <span>{formatCurrency(selectedSettlement.total_earnings)}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Deductions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedSettlementComponents
                          .filter(comp => comp.type === 'deduction')
                          .map((component, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{component.name}</span>
                              <span>{formatCurrency(component.amount)}</span>
                            </div>
                          ))}
                        <div className="border-t pt-2 flex flex-col space-y-1">
                          {/* <div className="flex justify-between">
                            <span>Sum of Deductions</span>
                            <span>
                              {formatCurrency(
                                selectedSettlementComponents
                                  .filter(comp => comp.type === 'deduction')
                                  .reduce((sum, comp) => sum + comp.amount, 0)
                              )}
                            </span>
                          </div> */}
                          <div className="flex justify-between font-semibold">
                            <span>Total Deductions</span>
                            <span>{formatCurrency(selectedSettlement.total_deductions)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Net Settlement Amount</span>
                      <span className="text-green-600">{formatCurrency(selectedSettlement.net_amount)}</span>
                    </div>
                    {selectedSettlement.status === 'pending' && (
                      <div className="mt-4">
                        <Button 
                          onClick={() => handleCalculateSettlement(selectedSettlement.id)}
                          className="w-full"
                        >
                          <Calculator className="w-4 h-4 mr-2" />
                          Calculate Settlement
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Document management feature will be available soon. You'll be able to upload and manage settlement-related documents here.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};

export default HRSettlement;
