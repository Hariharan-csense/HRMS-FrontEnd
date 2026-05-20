import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Plus, Save, Trash2, Edit, X, PackagePlus } from 'lucide-react';
import ENDPOINTS from '../lib/endpoint';
import { showToast } from '@/utils/toast';

const formatPrice = (price: number): string => {
  return `\u20B9${price.toLocaleString('en-IN')}`;
};

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearly_price?: number;
  max_users: number;
  trial_days: number;
  is_active: boolean;
  storage_gb?: number;
}

interface SubscriptionAddon {
  id: number;
  name: string;
  description?: string;
  module_key: string;
  price_upto25: number;
  price_upto50: number;
  price_above50: number;
  is_active: boolean;
}

interface CompanyOption {
  id: number;
  company_name: string;
  user_count?: number;
}

const moduleOptions = [
  { value: 'live_tracking', label: 'Live Tracking' },
  { value: 'client_attendance', label: 'Field Attendance' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'tickets', label: 'Ticket Management' },
  { value: 'assets', label: 'Assets' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'hr_management', label: 'RMS & Recruitment' },
  { value: 'exit', label: 'Exit & Offboarding' },
];

const SubscriptionPlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [editorSessionKey, setEditorSessionKey] = useState(0);
  const [addons, setAddons] = useState<SubscriptionAddon[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [editingAddon, setEditingAddon] = useState<SubscriptionAddon | null>(null);
  const [isCreatingAddon, setIsCreatingAddon] = useState(false);
  const [isSavingAddon, setIsSavingAddon] = useState(false);
  const [isAssigningAddon, setIsAssigningAddon] = useState(false);

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    yearly_price: '',
    storage_gb: '',
    trial_days: '',
    is_active: true
  });

  const [addonForm, setAddonForm] = useState({
    name: '',
    description: '',
    module_key: 'live_tracking',
    price_upto25: '100',
    price_upto50: '100',
    price_above50: '100',
    is_active: true
  });

  const [assignmentForm, setAssignmentForm] = useState({
    company_id: '',
    addon_id: '',
    users_count: '8',
    billing_cycle: 'monthly'
  });

  useEffect(() => {
    fetchPlans();
    fetchAddons();
    fetchCompanies();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await ENDPOINTS.getAllSubscriptionPlans();
      const fetchedPlans = (response.data?.data || []).map((plan: any) => ({
        ...plan,
        price: Number(plan.price || 0),
        yearly_price: plan.yearly_price !== undefined && plan.yearly_price !== null
          ? Number(plan.yearly_price)
          : undefined,
        storage_gb: plan.storage_gb !== undefined && plan.storage_gb !== null ? Number(plan.storage_gb) : undefined,
        trial_days: Number(plan.trial_days || 0),
      }));
      setPlans(fetchedPlans);
    } catch (fetchError: any) {
      console.error('Error fetching plans:', fetchError);
      const message = fetchError.response?.data?.message || 'Failed to fetch plans';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      description: '',
      price: '',
      yearly_price: '',
      storage_gb: '',
      trial_days: '',
      is_active: true
    });
    setEditingPlan(null);
    setIsCreatingPlan(false);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditorSessionKey((prev) => prev + 1);
    setEditingPlan(plan);
    setIsCreatingPlan(false);
    setPlanForm({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price?.toString() || '',
      yearly_price: plan.yearly_price?.toString() || '',
      storage_gb: plan.storage_gb?.toString() || '',
      trial_days: plan.trial_days?.toString() || '',
      is_active: plan.is_active
    });
  };

  const fetchAddons = async () => {
    try {
      const response = await ENDPOINTS.getSubscriptionAddons();
      setAddons((response.data?.data || []).map((addon: any) => ({
        ...addon,
        price_upto25: Number(addon.price_upto25 || 0),
        price_upto50: Number(addon.price_upto50 || 0),
        price_above50: Number(addon.price_above50 || 0),
      })));
    } catch (fetchError: any) {
      console.error('Error fetching add-ons:', fetchError);
      showToast.error(fetchError.response?.data?.message || 'Failed to fetch add-ons');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await ENDPOINTS.getSuperAdminCompanies();
      setCompanies(response.data?.data || []);
    } catch (fetchError: any) {
      console.error('Error fetching companies:', fetchError);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPlan(true);
    try {
      const payload = {
        name: planForm.name,
        description: planForm.description,
        price: Number(planForm.price),
        yearly_price: Number(planForm.yearly_price),
        max_users: 0,
        storage_gb: planForm.storage_gb ? Number(planForm.storage_gb) : undefined,
        trial_days: Number(planForm.trial_days),
        is_active: planForm.is_active
      };

      if (editingPlan) {
        await ENDPOINTS.updateSubscriptionPlan(editingPlan.id, payload);
      } else {
        await ENDPOINTS.createSubscriptionPlan(payload);
      }

      showToast.success('Package saved');
      resetPlanForm();
      fetchPlans();
    } catch (saveError: any) {
      console.error('Error saving plan:', saveError);
      showToast.error(saveError.response?.data?.message || 'Failed to save package');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      const response = await ENDPOINTS.deleteSubscriptionPlan(planId);
      showToast.success(response.data?.message || 'Package deleted');
      fetchPlans();
    } catch (deleteError: any) {
      console.error('Error deleting plan:', deleteError);
      showToast.error(deleteError.response?.data?.message || 'Failed to delete package');
    }
  };

  const resetAddonForm = () => {
    setAddonForm({
      name: '',
      description: '',
      module_key: 'live_tracking',
      price_upto25: '100',
      price_upto50: '100',
      price_above50: '100',
      is_active: true
    });
    setEditingAddon(null);
    setIsCreatingAddon(false);
  };

  const handleEditAddon = (addon: SubscriptionAddon) => {
    setEditingAddon(addon);
    setIsCreatingAddon(false);
    setAddonForm({
      name: addon.name || '',
      description: addon.description || '',
      module_key: addon.module_key || 'live_tracking',
      price_upto25: String(addon.price_upto25 || 0),
      price_upto50: String(addon.price_upto50 || 0),
      price_above50: String(addon.price_above50 || 0),
      is_active: addon.is_active
    });
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddon(true);
    try {
      const payload = {
        name: addonForm.name,
        description: addonForm.description,
        module_key: addonForm.module_key,
        price_upto25: Number(addonForm.price_upto25),
        price_upto50: Number(addonForm.price_upto50),
        price_above50: Number(addonForm.price_above50),
        is_active: addonForm.is_active
      };

      if (editingAddon) {
        await ENDPOINTS.updateSubscriptionAddon(editingAddon.id, payload);
      } else {
        await ENDPOINTS.createSubscriptionAddon(payload);
      }

      showToast.success('Add-on saved');
      resetAddonForm();
      fetchAddons();
    } catch (saveError: any) {
      console.error('Error saving add-on:', saveError);
      showToast.error(saveError.response?.data?.message || 'Failed to save add-on');
    } finally {
      setIsSavingAddon(false);
    }
  };

  const handleDeleteAddon = async (addonId: number) => {
    if (!confirm('Are you sure you want to delete this add-on package?')) return;
    try {
      const response = await ENDPOINTS.deleteSubscriptionAddon(addonId);
      showToast.success(response.data?.message || 'Add-on deleted');
      fetchAddons();
    } catch (deleteError: any) {
      console.error('Error deleting add-on:', deleteError);
      showToast.error(deleteError.response?.data?.message || 'Failed to delete add-on');
    }
  };

  const handleAssignAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigningAddon(true);
    try {
      await ENDPOINTS.assignSubscriptionAddon({
        company_id: Number(assignmentForm.company_id),
        addon_id: Number(assignmentForm.addon_id),
        users_count: Number(assignmentForm.users_count),
        billing_cycle: assignmentForm.billing_cycle
      });
      showToast.success('Add-on assigned to organization');
      setAssignmentForm({ company_id: '', addon_id: '', users_count: '8', billing_cycle: 'monthly' });
    } catch (assignError: any) {
      console.error('Error assigning add-on:', assignError);
      showToast.error(assignError.response?.data?.message || 'Failed to assign add-on');
    } finally {
      setIsAssigningAddon(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIzIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
          <div className="relative px-6 py-10 sm:px-8 sm:py-12">
            <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Pricing Management
                </span>
                <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">Subscription Plans</h1>
                <p className="mt-2 text-green-100 text-sm sm:text-base">
                  Create and manage package names, monthly pricing, yearly pricing, storage, and trial days.
                </p>
              </div>
              <Button
                type="button"
                className="bg-white text-green-700 hover:bg-gray-100 px-5 py-2.5 font-semibold shadow-md"
                onClick={() => {
                  resetPlanForm();
                  setIsCreatingPlan(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            </div>
          </div>
        </section>

        <div className="p-6 space-y-8">
          {error && (
            <Card className="border border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Packages</CardTitle>
                  <p className="text-sm text-gray-600">Manage package names, monthly pricing, yearly pricing, storage, and trial days.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {(isCreatingPlan || editingPlan) && (
                <Card className="border border-dashed border-gray-300 bg-white">
                  <CardContent className="p-6">
                    <form
                      key={editingPlan ? `edit-${editingPlan.id}-${editorSessionKey}` : `create-plan-${editorSessionKey}`}
                      onSubmit={handleSavePlan}
                      className="space-y-6"
                      autoComplete="off"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {editingPlan ? `Edit ${editingPlan.name}` : 'Create Package'}
                        </h3>
                        <Button type="button" variant="ghost" onClick={resetPlanForm}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Package Name</Label>
                          <Input
                            name="plan_name"
                            autoComplete="off"
                            value={planForm.name}
                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                            className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Monthly Price</Label>
                          <Input
                            type="number"
                            name="monthly_price"
                            autoComplete="off"
                            min="0"
                            value={planForm.price}
                            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                            className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Yearly Price</Label>
                          <Input
                            type="number"
                            name="yearly_price"
                            autoComplete="off"
                            min="0"
                            value={planForm.yearly_price}
                            onChange={(e) => setPlanForm({ ...planForm, yearly_price: e.target.value })}
                            className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Storage (GB)</Label>
                          <Input
                            type="number"
                            name="storage_gb"
                            autoComplete="off"
                            min="0"
                            value={planForm.storage_gb}
                            onChange={(e) => setPlanForm({ ...planForm, storage_gb: e.target.value })}
                            className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Trial Days</Label>
                          <Input
                            type="number"
                            name="trial_days"
                            autoComplete="off"
                            min="0"
                            value={planForm.trial_days}
                            onChange={(e) => setPlanForm({ ...planForm, trial_days: e.target.value })}
                            className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id="plan-active"
                            type="checkbox"
                            checked={planForm.is_active}
                            onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                          />
                          <Label htmlFor="plan-active">Active</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Package Modules</Label>
                        <Textarea
                          name="plan_description"
                          autoComplete="off"
                          value={planForm.description}
                          onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                          rows={4}
                          className="bg-white border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                          placeholder="Enter each module on a new line"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingPlan} className="bg-green-600 hover:bg-green-700 shadow-sm">
                          <Save className="w-4 h-4 mr-2" />
                          {isSavingPlan ? 'Saving...' : 'Save Package'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {plans.length > 0 ? (
                <div className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/10 before:to-transparent before:rounded-2xl before:blur-2xl before:-z-10 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-3/4 before:h-3/4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                      const isPopular = plan.name?.toLowerCase?.().includes('standard');

                      return (
                        <div
                          key={plan.id}
                          className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                            isPopular ? 'border-2 border-orange-400 ring-4 ring-orange-100' : 'border border-gray-200'
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                              Most Popular
                            </div>
                          )}

                          <div className={`p-6 ${isPopular ? 'pt-12' : 'pt-6'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                              </div>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {plan.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <p className="text-[10px] uppercase text-gray-500">Monthly</p>
                                <p className="text-lg font-semibold text-gray-900">{formatPrice(plan.price || 0)}</p>
                              </div>
                              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <p className="text-[10px] uppercase text-gray-500">Yearly</p>
                                <p className="text-lg font-semibold text-emerald-700">{formatPrice(plan.yearly_price || 0)}</p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                              <span>Storage: {plan.storage_gb ? `${plan.storage_gb}GB` : '-'}</span>
                              <span>Trial: {plan.trial_days} days</span>
                            </div>

                            <div className="mt-6 space-y-2">
                              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Modules</p>
                              <div className="flex flex-wrap gap-2">
                                {plan.description
                                  .split('\n')
                                  .filter(Boolean)
                                  .slice(0, 8)
                                  .map((item, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                                    >
                                      {item}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 flex-1"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-600 hover:bg-red-50 flex-1"
                                onClick={() => handleDeletePlan(plan.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card className="border border-dashed border-gray-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600">No packages created yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4 border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        resetPlanForm();
                        setIsCreatingPlan(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Package
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Add-on Packages</CardTitle>
                  <p className="text-sm text-gray-600">
                    Sell selected modules on top of an organization's base plan with a separate seat count.
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    resetAddonForm();
                    setIsCreatingAddon(true);
                  }}
                >
                  <PackagePlus className="w-4 h-4 mr-2" />
                  Add Module Package
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {(isCreatingAddon || editingAddon) && (
                <Card className="border border-dashed border-gray-300 bg-white">
                  <CardContent className="p-6">
                    <form onSubmit={handleSaveAddon} className="space-y-6" autoComplete="off">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {editingAddon ? `Edit ${editingAddon.name}` : 'Create Add-on Package'}
                        </h3>
                        <Button type="button" variant="ghost" onClick={resetAddonForm}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Add-on Name</Label>
                          <Input
                            value={addonForm.name}
                            onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                            placeholder="Tracking Management"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Module</Label>
                          <select
                            value={addonForm.module_key}
                            onChange={(e) => setAddonForm({ ...addonForm, module_key: e.target.value })}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                          >
                            {moduleOptions.map((module) => (
                              <option key={module.value} value={module.value}>
                                {module.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Price/User up to 25</Label>
                          <Input
                            type="number"
                            min="0"
                            value={addonForm.price_upto25}
                            onChange={(e) => setAddonForm({ ...addonForm, price_upto25: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Price/User up to 50</Label>
                          <Input
                            type="number"
                            min="0"
                            value={addonForm.price_upto50}
                            onChange={(e) => setAddonForm({ ...addonForm, price_upto50: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Price/User above 50</Label>
                          <Input
                            type="number"
                            min="0"
                            value={addonForm.price_above50}
                            onChange={(e) => setAddonForm({ ...addonForm, price_above50: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id="addon-active"
                            type="checkbox"
                            checked={addonForm.is_active}
                            onChange={(e) => setAddonForm({ ...addonForm, is_active: e.target.checked })}
                          />
                          <Label htmlFor="addon-active">Active</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Description</Label>
                        <Textarea
                          value={addonForm.description}
                          onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                          rows={3}
                          placeholder="Live tracking management for selected field employees"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingAddon} className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4 mr-2" />
                          {isSavingAddon ? 'Saving...' : 'Save Add-on'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Assign Add-on to Organization</CardTitle>
                  <p className="text-sm text-gray-600">
                    Example: Basic plan organization + Tracking Management add-on for 8 users.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignAddon} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Organization</Label>
                      <select
                        value={assignmentForm.company_id}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, company_id: e.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select organization</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.company_name} ({company.user_count || 0} users)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Add-on</Label>
                      <select
                        value={assignmentForm.addon_id}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, addon_id: e.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select add-on</option>
                        {addons.filter((addon) => addon.is_active).map((addon) => (
                          <option key={addon.id} value={addon.id}>
                            {addon.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Seats</Label>
                      <Input
                        type="number"
                        min="1"
                        value={assignmentForm.users_count}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, users_count: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Billing</Label>
                      <select
                        value={assignmentForm.billing_cycle}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, billing_cycle: e.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="md:col-span-5 flex justify-end">
                      <Button type="submit" disabled={isAssigningAddon} className="bg-green-600 hover:bg-green-700">
                        {isAssigningAddon ? 'Assigning...' : 'Assign Add-on'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {addons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {addons.map((addon) => (
                    <div key={addon.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{addon.name}</h4>
                          <p className="mt-1 text-xs font-medium uppercase text-gray-500">{addon.module_key}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${addon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {addon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="mt-3 text-sm text-gray-600">{addon.description}</p>
                      )}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] uppercase text-gray-500">&lt;=25</p>
                          <p className="font-semibold">{formatPrice(addon.price_upto25)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] uppercase text-gray-500">&lt;=50</p>
                          <p className="font-semibold">{formatPrice(addon.price_upto50)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] uppercase text-gray-500">&gt;50</p>
                          <p className="font-semibold">{formatPrice(addon.price_above50)}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditAddon(addon)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteAddon(addon.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border border-dashed border-gray-200 bg-white">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600">No add-on packages created yet.</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPlansManagement;
