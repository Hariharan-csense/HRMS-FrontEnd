import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, Plus, Edit, Trash2, Save, X, Users, X as XIcon, Check } from 'lucide-react';
import ENDPOINTS from '../lib/endpoint';
import { showToast } from '@/utils/toast';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  max_users: number;
  storage_gb?: number;
  trial_days: number;
  billing_cycle: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


const getStorageForPlan = (plan: SubscriptionPlan): string => {
  if (plan.storage_gb) {
    return `${plan.storage_gb}GB`;
  }
  
  // Fallback to name-based calculation for backward compatibility
  const name = plan.name.toLowerCase();
  
  if (name.includes('free')) {
    return '500MB';
  }
  
  if (name.includes('basic') || name.includes('starter')) {
    return '2GB';
  }
  
  if (name.includes('professional') || name.includes('pro')) {
    return '5GB';
  }
  
  if (name.includes('business') || name.includes('premium') || name.includes('enterprise')) {
    return '10GB';
  }
  
  return '1GB'; // Default storage
};

const getYearlyPrice = (monthlyPrice: number): number => {
  // Calculate yearly price with 2 months discount (pay for 10 months, get 12)
  return Math.round(monthlyPrice * 10);
};

const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const SubscriptionPlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthly_price: '',
    yearly_price: '',
    max_users: '',
    storage_gb: '',
    trial_days: '',
    billing_cycle: 'monthly',
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await ENDPOINTS.getAllSubscriptionPlans();
      setPlans(response.data?.data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      setError(error.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthly_price: '',
      yearly_price: '',
      max_users: '',
      storage_gb: '',
      trial_days: '',
      billing_cycle: 'monthly',
      is_active: true
    });
    setIsCreating(false);
    setEditingPlan(null);
  };

  const handleCreate = () => {
    console.log('handleCreate called');
    setEditingPlan(null);
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsCreating(false);
    setFormData({
      name: plan.name,
      description: plan.description,
      monthly_price: plan.price.toString(),
      yearly_price: (plan.price * 10).toString(), // Calculate yearly price
      max_users: plan.max_users.toString(),
      storage_gb: plan.storage_gb?.toString() || '',
      trial_days: plan.trial_days.toString(),
      billing_cycle: plan.billing_cycle,
      is_active: plan.is_active
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSavingPlan(true);
    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.monthly_price), // Use monthly price as base
        monthly_price: parseFloat(formData.monthly_price),
        yearly_price: parseFloat(formData.yearly_price),
        max_users: parseInt(formData.max_users),
        storage_gb: parseInt(formData.storage_gb) || 1,
        trial_days: parseInt(formData.trial_days)
      };

      console.log('Submitting plan data:', planData);

      if (editingPlan) {
        // Update existing plan
        console.log('Updating plan:', editingPlan.id);
        const response = await ENDPOINTS.updateSubscriptionPlan(editingPlan.id, planData);
        console.log('Update response:', response.data);
      } else {
        // Create new plan
        console.log('Creating new plan...');
        const response = await ENDPOINTS.createSubscriptionPlan(planData);
        console.log('Create response:', response.data);
      }

      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      console.error('Error response:', error.response?.data);
      showToast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await ENDPOINTS.deleteSubscriptionPlan(planId);
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      showToast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleToggleActive = async (planId: number, isActive: boolean) => {
    try {
      await ENDPOINTS.patchSubscriptionPlan(planId, { is_active: isActive });
      fetchPlans();
    } catch (error: any) {
      console.error('Error updating plan status:', error);
      showToast.error(error.response?.data?.message || 'Failed to update plan status');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const startRazorpayUpgradePayment = async (plan: SubscriptionPlan) => {
    setIsPaying(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        showToast.error('Failed to load Razorpay. Please check your internet connection.');
        return;
      }

      const orderRes = await ENDPOINTS.createSubscriptionUpgradeOrder(plan.id);
      const orderData = orderRes.data?.data;

      if (!orderData?.order_id || !orderData?.key_id) {
        showToast.error('Failed to create payment order');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const options: any = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'HRMS',
        description: `Upgrade to ${plan.name}`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await ENDPOINTS.verifySubscriptionUpgradePayment({
              plan_id: plan.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            showToast.success(verifyRes.data?.message || 'Payment successful');
          } catch (e: any) {
            showToast.error(e.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || user?.username || '',
          email: user?.email || ''
        },
        theme: { color: '#16a34a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        showToast.error(resp?.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (e: any) {
      showToast.error(e.response?.data?.message || 'Failed to start payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-600 mt-1">Manage your subscription plans and pricing</p>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Plan
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingPlan) && (
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Create New Plan' : `Edit ${editingPlan?.name} Plan`}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={resetForm}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">Plan Name</Label>
                    <Input
                      id="name"
                      className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_price" className="text-gray-700 font-medium">Monthly Price (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="monthly_price"
                        type="number"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({...formData, monthly_price: e.target.value})}
                        required
                        className="pl-8 bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        min="0"
                        step="0.01"
                        placeholder="Enter monthly price"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearly_price" className="text-gray-700 font-medium">Yearly Price (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="yearly_price"
                        type="number"
                        value={formData.yearly_price}
                        onChange={(e) => setFormData({...formData, yearly_price: e.target.value})}
                        required
                        className="pl-8 bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        min="0"
                        step="0.01"
                        placeholder="Enter yearly price"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Recommended: {formatPrice(parseFloat(formData.monthly_price) * 10 || 0)} (2 months free)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_users" className="text-gray-700 font-medium">Max Users</Label>
                    <Input
                      id="max_users"
                      type="number"
                      placeholder='e.g., 10'
                      value={formData.max_users}
                      onChange={(e) => setFormData({...formData, max_users: e.target.value})}
                      required
                      min="0"
                      className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage_gb" className="text-gray-700 font-medium">Storage (GB)</Label>
                    <Input
                      id="storage_gb"
                      type="number"
                      placeholder='e.g., 5'
                      value={formData.storage_gb}
                      onChange={(e) => setFormData({...formData, storage_gb: e.target.value})}
                      min="0"
                      className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_cycle" className="text-gray-700 font-medium">Billing Cycle</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value) => setFormData({...formData, billing_cycle: value})}
                    >
                      <SelectTrigger className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500">
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Customers can choose to pay monthly or yearly (with 2 months discount)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trial_days" className="text-gray-700 font-medium">Trial Days</Label>
                    <Input
                      id="trial_days"
                      type="number"
                      value={formData.trial_days}
                      onChange={(e) => setFormData({...formData, trial_days: e.target.value})}
                      required
                      min="0"
                      className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      placeholder="Enter trial period in days"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    required
                    className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="Enter plan features, one per line..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter each feature on a new line. They will be displayed as bullet points.
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSavingPlan}
                    className="bg-green-600 hover:bg-green-700 px-6"
                  >
                    {isSavingPlan ? (
                      editingPlan ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Creating...
                        </>
                      )
                    ) : isCreating ? (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Plan
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Plans List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isMostPopular = plan.name.toLowerCase() === 'starter';
            
            return (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  plan.is_active 
                    ? isMostPopular 
                      ? 'border-2 border-orange-400 ring-4 ring-orange-100' 
                      : 'border border-gray-200'
                    : 'border border-gray-200 opacity-75'
                }`}
              >
                {isMostPopular && plan.is_active && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                {!plan.is_active && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Inactive
                  </div>
                )}
                
                <div className={`p-8 ${isMostPopular ? 'pt-12' : 'pt-8'}`}>
                  {/* User Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-600" />
                    </div>
                  </div>
                  
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                    {plan.name}
                  </h3>
                  
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-600 text-lg">/month</span>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-green-600 font-semibold text-lg">
                        {formatPrice(getYearlyPrice(plan.price))}/year
                      </span>
                      <span className="text-green-500 text-sm block">
                        Save {formatPrice(plan.price * 2)} (2 months free!)
                      </span>
                    </div>
                    {plan.price > 0 && (
                      <span className="text-gray-500 text-sm">+ Taxes</span>
                    )}
                  </div>
                  
                  {/* User/Storage Details */}
                  <div className="text-center mb-8">
                    <p className="text-gray-700 font-medium">
                      Up to {plan.max_users} Users, {getStorageForPlan(plan)} Storage
                    </p>
                  </div>
                  
                  {/* Plan Description with Bullet Points */}
                  <div className="space-y-3 mb-8">
                    {plan.description.split('\n').map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <span className="text-gray-700 text-sm flex-1">{item}</span>
                        <div className="flex items-center justify-center w-6 h-6">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Admin Actions */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    
                    <Button
                      variant={plan.is_active ? 'outline' : 'default'}
                      className={`w-full ${
                        plan.is_active 
                          ? 'border-red-500 text-red-600 hover:bg-red-50' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      onClick={() => handleToggleActive(plan.id, !plan.is_active)}
                    >
                      {plan.is_active ? 'Deactivate Plan' : 'Activate Plan'}
                    </Button>
                  </div>
                  
                  {/* Trial Information */}
                  <div className="text-center mt-4">
                    <p className="text-gray-600 text-sm">
                      {plan.trial_days} days free trial
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {plans.length === 0 && !isCreating && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No subscription plans found.</p>
              <p className="text-sm text-gray-500 mt-2">Click "Add New Plan" to create your first subscription plan.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionPlansManagement;
