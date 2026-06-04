import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, CheckCircle, Clock, Users, CreditCard, Calendar, Star, Zap, Shield, Crown, ChevronRight, Check, PackagePlus, ChevronDown } from 'lucide-react';
import { Layout } from '@/components/Layout';
import ENDPOINTS from '../lib/endpoint';
import { showToast } from '@/utils/toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isCordovaIOS } from '@/lib/platform';

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
  yearly_price?: number;
  max_users: number;
  storage_gb?: number;
  trial_days: number;
  is_active: boolean;
}

interface CompanySubscription {
  id: number;
  plan_id: number;
  plan_name: string;
  plan_description: string;
  plan_price: number;
  plan_max_users: number;
  plan_storage_gb?: number;
  start_date: string;
  end_date: string;
  trial_end_date?: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  max_users: number;
  storage_gb?: number;
  used_storage_mb?: number;
  paid_amount?: number;
  last_payment_date?: string;
  next_billing_date?: string;
  days_remaining: number;
  is_trial_active: boolean;
  trial_days_remaining: number;
  storage_usage_percentage?: number;
  addons?: Array<{
    id: number;
    addon_id?: number;
    name: string;
    module_key?: string;
    users_count: number;
    total_price?: number;
    assigned_employee_ids?: number[];
  }>;
}

interface SubscriptionAddon {
  id: number;
  name: string;
  description?: string;
  module_key?: string;
  price_upto5?: number;
  price_upto10?: number;
  price_upto15?: number;
  price_upto25: number;
  price_upto50: number;
  price_above50: number;
  is_active: boolean;
}

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  transaction_id: string;
  payment_reference: string;
  status: string;
  payment_date: string;
}

interface EmployeeOption {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  employee_id?: string;
  email?: string;
}

interface AddonAssignment {
  id: number;
  addon_id: number;
  name: string;
  module_key?: string;
  users_count: number;
  assignments: Array<{
    employee_id: number;
    name?: string;
    employee_code?: string;
    email?: string;
  }>;
}

const buildAddonAssignmentsFromSubscription = (
  subscription: CompanySubscription | null
): AddonAssignment[] =>
  (subscription?.addons || []).map((addon) => ({
    id: Number(addon.id),
    addon_id: Number(addon.addon_id || addon.id),
    name: addon.name,
    module_key: addon.module_key,
    users_count: Number(addon.users_count || 0),
    assignments: (addon.assigned_employee_ids || []).map((employeeId) => ({
      employee_id: Number(employeeId),
    })),
  }));


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

  if (name.includes('standard') || name.includes('professional') || name.includes('pro')) {
    return '5GB';
  }

  if (name.includes('advanced') || name.includes('advance') || name.includes('business') || name.includes('premium') || name.includes('enterprise')) {
    return '10GB';
  }

  return '1GB'; // Default storage
};

const getPricingSummary = (
  plan: {
    price?: number;
    yearly_price?: number;
  },
  usersCount: number,
  billingCycle: 'monthly' | 'yearly'
) => {
  const monthlyPerUser = Number(plan.price || 0);
  const yearlyPerUserMonthly = Number(plan.yearly_price || 0);
  const effectivePerUser = billingCycle === 'yearly' ? yearlyPerUserMonthly : monthlyPerUser;
  const totalPrice = effectivePerUser * usersCount * (billingCycle === 'yearly' ? 12 : 1);

  return {
    monthlyPerUser,
    yearlyPerUserMonthly,
    effectivePerUser,
    savingsPerUser: Number((monthlyPerUser - yearlyPerUserMonthly).toFixed(2)),
    totalPrice
  };
};

const getAddonPricingSummary = (
  addon: SubscriptionAddon,
  usersCount: number,
  billingCycle: 'monthly' | 'yearly'
) => {
  const priceUpto5 = Number(addon.price_upto5 ?? addon.price_upto25 ?? 0);
  const priceUpto10 = Number(addon.price_upto10 ?? addon.price_upto50 ?? priceUpto5);
  const priceUpto15 = Number(addon.price_upto15 ?? addon.price_above50 ?? priceUpto10);
  const pricePerUser =
    usersCount <= 5
      ? priceUpto5
      : usersCount <= 10
        ? priceUpto10
        : priceUpto15;
  const totalPrice = pricePerUser * usersCount * (billingCycle === 'yearly' ? 12 : 1);

  return {
    pricePerUser,
    totalPrice
  };
};

const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const formatCurrency = (price: number): string => {
  return `\u20B9${price.toLocaleString('en-IN')}`;
};

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { checkSubscriptionStatus } = useSubscription();
  const hideRegistration = isCordovaIOS();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<SubscriptionAddon[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [addonAssignments, setAddonAssignments] = useState<AddonAssignment[]>([]);
  const [assignmentSelections, setAssignmentSelections] = useState<Record<number, number[]>>({});
  const [expandedAddonAssignments, setExpandedAddonAssignments] = useState<Record<number, boolean>>({});
  const [savingAssignmentId, setSavingAssignmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<SubscriptionAddon | null>(null);
  const [showAddonPaymentModal, setShowAddonPaymentModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isAddonPaying, setIsAddonPaying] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(25);
  const [selectedUsersInput, setSelectedUsersInput] = useState("25");
  const [selectedAddonUsers, setSelectedAddonUsers] = useState(8);
  const [selectedAddonUsersInput, setSelectedAddonUsersInput] = useState("8");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedAddonBillingCycle, setSelectedAddonBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    console.log('fetchSubscriptionData called');
    try {
      console.log('Making API calls...');
      const [plansRes, subscriptionRes, paymentsRes, addonsRes] = await Promise.all([
        ENDPOINTS.getSubscriptionPlans(),
        ENDPOINTS.getCurrentSubscription(),
        ENDPOINTS.getSubscriptionPayments(),
        ENDPOINTS.getAvailableSubscriptionAddons()
      ]);

      console.log('API responses received:', { plansRes, subscriptionRes, paymentsRes, addonsRes });

      setPlans(plansRes.data?.data || []);
      setAddons(addonsRes.data?.data || []);
      if (!selectedPlan && (plansRes.data?.data || []).length > 0) {
        setSelectedPlan((plansRes.data?.data || [])[0]);
      }
      const subscriptionData = subscriptionRes.data?.data || null;
      setCurrentSubscription(subscriptionData);
      setPayments(paymentsRes.data?.data || []);

      const [employeesRes, assignmentsRes] = await Promise.allSettled([
        ENDPOINTS.getEmployee(),
        ENDPOINTS.getSubscriptionAddonAssignments(),
      ]);

      if (employeesRes.status === 'fulfilled') {
        setEmployees(employeesRes.value.data?.data || employeesRes.value.data?.employees || []);
      }

      if (assignmentsRes.status === 'fulfilled') {
        const fetchedAssignments = assignmentsRes.value.data?.data || [];
        const resolvedAssignments = fetchedAssignments.length > 0
          ? fetchedAssignments
          : buildAddonAssignmentsFromSubscription(subscriptionData);
        setAddonAssignments(resolvedAssignments);
        setAssignmentSelections(
          resolvedAssignments.reduce((acc: Record<number, number[]>, addon: AddonAssignment) => {
            acc[addon.id] = (addon.assignments || []).map((assignment) => Number(assignment.employee_id));
            return acc;
          }, {})
        );
      } else {
        const fallbackAssignments = buildAddonAssignmentsFromSubscription(subscriptionData);
        setAddonAssignments(fallbackAssignments);
        setAssignmentSelections(
          fallbackAssignments.reduce((acc: Record<number, number[]>, addon: AddonAssignment) => {
            acc[addon.id] = (addon.assignments || []).map((assignment) => Number(assignment.employee_id));
            return acc;
          }, {})
        );
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      // Set default values to prevent undefined errors
      setPlans([]);
      setAddons([]);
      setCurrentSubscription(null);
      setPayments([]);
      setAddonAssignments([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (planId: number) => {
    try {
      const response = await ENDPOINTS.startSubscriptionTrial({
        plan_id: planId,
        users_count: selectedUsers,
        billing_cycle: selectedBillingCycle
      });
      showToast.success(response.data.message);
      await Promise.all([
        fetchSubscriptionData(),
        checkSubscriptionStatus(),
      ]);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to start trial');
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

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setIsPaying(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        showToast.error('Failed to load Razorpay. Please check your internet connection.');
        return;
      }

      const orderRes = await ENDPOINTS.createSubscriptionUpgradeOrder({
        plan_id: selectedPlan.id,
        users_count: selectedUsers,
        billing_cycle: selectedBillingCycle
      });
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
        description: `Upgrade to ${selectedPlan.name}`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await ENDPOINTS.verifySubscriptionUpgradePayment({
              plan_id: selectedPlan.id,
              users_count: selectedUsers,
              billing_cycle: selectedBillingCycle,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            showToast.success(verifyRes.data?.message || 'Payment successful');
            setShowPaymentModal(false);
            setSelectedPlan(null);
            await Promise.all([
              fetchSubscriptionData(),
              checkSubscriptionStatus(),
            ]);
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
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to start payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleBuyAddon = async () => {
    if (!selectedAddon) return;

    setIsAddonPaying(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        showToast.error('Failed to load Razorpay. Please check your internet connection.');
        return;
      }

      const orderRes = await ENDPOINTS.createSubscriptionAddonOrder({
        addon_id: selectedAddon.id,
        users_count: selectedAddonUsers,
        billing_cycle: selectedAddonBillingCycle
      });
      const orderData = orderRes.data?.data;

      if (!orderData?.order_id || !orderData?.key_id) {
        showToast.error('Failed to create add-on payment order');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const options: any = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'HRMS',
        description: `Buy add-on: ${selectedAddon.name}`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await ENDPOINTS.verifySubscriptionAddonPayment({
              addon_id: selectedAddon.id,
              users_count: selectedAddonUsers,
              billing_cycle: selectedAddonBillingCycle,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            showToast.success(verifyRes.data?.message || 'Add-on purchased successfully');
            setShowAddonPaymentModal(false);
            setSelectedAddon(null);
            await Promise.all([
              fetchSubscriptionData(),
              checkSubscriptionStatus(),
            ]);
          } catch (e: any) {
            showToast.error(e.response?.data?.message || 'Add-on payment verification failed');
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
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to start add-on payment');
    } finally {
      setIsAddonPaying(false);
    }
  };

  const getEmployeeDisplayName = (employee: EmployeeOption) => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    return fullName || employee.name || employee.email || `Employee ${employee.id}`;
  };

  const toggleAddonEmployee = (subscriptionAddonId: number, employeeId: number, maxUsers: number) => {
    setAssignmentSelections((prev) => {
      const current = prev[subscriptionAddonId] || [];
      const isSelected = current.includes(employeeId);
      if (isSelected) {
        return {
          ...prev,
          [subscriptionAddonId]: current.filter((id) => id !== employeeId),
        };
      }

      if (current.length >= maxUsers) {
        showToast.error(`This add-on allows only ${maxUsers} users`);
        return prev;
      }

      return {
        ...prev,
        [subscriptionAddonId]: [...current, employeeId],
      };
    });
  };

  const handleSaveAddonUsers = async (subscriptionAddonId: number) => {
    setSavingAssignmentId(subscriptionAddonId);
    try {
      await ENDPOINTS.updateSubscriptionAddonUsers(subscriptionAddonId, {
        employee_ids: assignmentSelections[subscriptionAddonId] || [],
      });
      showToast.success('Add-on users updated');
      await Promise.all([
        fetchSubscriptionData(),
        checkSubscriptionStatus(),
      ]);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update add-on users');
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const toggleAddonAssignmentPanel = (subscriptionAddonId: number) => {
    setExpandedAddonAssignments((prev) => ({
      ...prev,
      [subscriptionAddonId]: !prev[subscriptionAddonId],
    }));
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('freeplan') || name.includes('free plan') || name.includes('free package') || (name.includes('free') && !name.includes('trial'))) {
      return <Star className="w-8 h-8 text-emerald-500" />;
    }
    if (name.includes('basic') || name.includes('starter')) {
      return <Shield className="w-8 h-8 text-blue-500" />;
    }
    if (name.includes('standard') || name.includes('pro') || name.includes('professional')) {
      return <Zap className="w-8 h-8 text-purple-500" />;
    }
    if (name.includes('advanced') || name.includes('advance') || name.includes('enterprise') || name.includes('premium')) {
      return <Crown className="w-8 h-8 text-amber-500" />;
    }
    return <Star className="w-8 h-8 text-green-500" />;
  };

  const getPlanGradient = (planName: string) => {
    return 'from-[#e6fbf4] to-white border-[#bff1e2]';
  };

  const getPlanAccentText = (planName: string) => {
    return 'text-[#17c491]';
  };

  const getButtonVariant = (planName: string, isUpgrade: boolean = false) => {
    const name = planName.toLowerCase();
    if (name.includes('advanced') || name.includes('advance') || name.includes('enterprise') || name.includes('premium')) {
      return isUpgrade ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' : 'border-amber-500 text-amber-600 hover:bg-amber-50';
    }
    if (name.includes('standard') || name.includes('pro') || name.includes('professional')) {
      return isUpgrade ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' : 'border-purple-500 text-purple-600 hover:bg-purple-50';
    }
    return isUpgrade ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white' : 'border-blue-500 text-blue-600 hover:bg-blue-50';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      trial: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" /> },
      active: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      expired: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-4 h-4" /> }
    };

    const variant = variants[status] || variants.cancelled;

    return (
      <Badge className={variant.color}>
        <span className="flex items-center gap-1">
          {variant.icon}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isTrialExpired = currentSubscription && currentSubscription.status === 'trial' && !currentSubscription.is_trial_active;
  // Only lock/blur the current plan once the company is on a paid active subscription.
  // During an active trial, keep plans selectable so the user can compare/upgrade freely.
  const hasPaidSubscription = !!currentSubscription && currentSubscription.status === 'active';
  return (
    <Layout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-[#e6fbf4] via-white to-white rounded-3xl">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#17c491]">Subscription Management</h1>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-[#17c491] to-[#0fa372] text-white rounded-t-xl py-4">
              <CardTitle className="flex items-center justify-between text-white text-lg">
                <span>Current Subscription</span>
                {getStatusBadge(currentSubscription.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {currentSubscription.status === 'trial' && currentSubscription.is_trial_active && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎉 Welcome! Your free trial is active
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Enjoy full access to all features during your trial period. Choose a plan below to upgrade anytime and continue using service without interruption.
                  </p>
                </div>
              )}

              {isTrialExpired && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    ⚠️ Your free trial has ended
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Your trial period has ended. Choose a plan below to subscribe and continue using all features without interruption.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold">{currentSubscription.plan_name}</p>
                  <ul className="mt-2 list-disc pl-4 text-sm text-gray-500 space-y-1">
                    {(currentSubscription.plan_description || "")
                      .split(/,|\n/)
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {currentSubscription.max_users || currentSubscription.plan_max_users || 0} Users
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Storage</p>
                  <p className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {currentSubscription.used_storage_mb ?
                      `${Math.round(currentSubscription.used_storage_mb / 1024 * 100) / 100}GB / ${currentSubscription.storage_gb || currentSubscription.plan_storage_gb || 1}GB`
                      : `${currentSubscription.storage_gb || currentSubscription.plan_storage_gb || 1}GB Total`
                    }
                  </p>
                  {currentSubscription.storage_usage_percentage !== undefined && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${currentSubscription.storage_usage_percentage > 90 ? 'bg-red-500' :
                              currentSubscription.storage_usage_percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(currentSubscription.storage_usage_percentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {currentSubscription.storage_usage_percentage}% used
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {currentSubscription.days_remaining} days remaining
                  </p>
                </div>
              </div>

              {currentSubscription.addons && currentSubscription.addons.length > 0 && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Active Add-ons</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentSubscription.addons.map((addon) => (
                      <span
                        key={addon.id}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200"
                      >
                        {addon.name} - {addon.users_count} seats
                      </span>
                    ))}
                  </div>

                  {addonAssignments.length > 0 && (
                    <div className="mt-5 space-y-4">
                      {addonAssignments.map((addon) => {
                        const selectedIds = assignmentSelections[addon.id] || [];
                        const isExpanded = Boolean(expandedAddonAssignments[addon.id]);
                        return (
                          <div key={addon.id} className="rounded-lg border border-emerald-200 bg-white p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <button
                                type="button"
                                className="flex flex-1 items-center justify-between gap-3 text-left"
                                onClick={() => toggleAddonAssignmentPanel(addon.id)}
                              >
                                <span>
                                  <span className="block text-sm font-semibold text-gray-900">{addon.name}</span>
                                  <span className="block text-xs text-gray-500">
                                    {selectedIds.length}/{addon.users_count} users assigned
                                  </span>
                                </span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              {isExpanded && (
                                <Button
                                  size="sm"
                                  className="bg-[#17c491] hover:bg-[#0fa372]"
                                  disabled={savingAssignmentId === addon.id}
                                  onClick={() => handleSaveAddonUsers(addon.id)}
                                >
                                  {savingAssignmentId === addon.id ? 'Saving...' : 'Save Users'}
                                </Button>
                              )}
                            </div>

                            {isExpanded && employees.length > 0 ? (
                              <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                                {employees.map((employee) => {
                                  const employeeId = Number(employee.id);
                                  const checked = selectedIds.includes(employeeId);
                                  return (
                                    <label
                                      key={employee.id}
                                      className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${
                                        checked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={checked}
                                        onChange={() => toggleAddonEmployee(addon.id, employeeId, addon.users_count)}
                                      />
                                      <span>
                                        <span className="block font-medium text-gray-900">{getEmployeeDisplayName(employee)}</span>
                                        <span className="block text-xs text-gray-500">
                                          {employee.employee_id || employee.email || '-'}
                                        </span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : isExpanded ? (
                              <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                                Employee list is not available for this login. Please use an admin/HR account to assign add-on users.
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentSubscription.is_trial_active && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Trial ends in {currentSubscription.trial_days_remaining} days
                  </p>
                </div>
              )}

              {/* Storage Warning */}
              {currentSubscription.storage_usage_percentage !== undefined && currentSubscription.storage_usage_percentage > 80 && (
                <div className={`mt-4 p-4 rounded-lg ${currentSubscription.storage_usage_percentage > 95 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                  <p className={`font-medium ${currentSubscription.storage_usage_percentage > 95 ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                    {currentSubscription.storage_usage_percentage > 95 ? '⚠️ Critical: Storage Almost Full!' : '⚠️ Storage Running Low'}
                  </p>
                  <p className={`text-sm mt-1 ${currentSubscription.storage_usage_percentage > 95 ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                    You're using {currentSubscription.storage_usage_percentage}% of your {currentSubscription.storage_gb || currentSubscription.plan_storage_gb || 1}GB storage limit.
                    {currentSubscription.storage_usage_percentage > 95 ?
                      ' Upload files will be blocked. Upgrade immediately to continue using the service.' :
                      ' Consider upgrading to a higher plan to avoid service interruption.'
                    }
                  </p>
                  <Button
                    className={`mt-3 ${currentSubscription.storage_usage_percentage > 95 ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                      } text-white`}
                    onClick={() => {
                      setShowPaymentModal(true);
                      setSelectedPlan(plans.find(p => p.storage_gb && p.storage_gb > (currentSubscription.storage_gb || currentSubscription.plan_storage_gb || 1)) || plans[plans.length - 1]);
                    }}
                  >
                    Upgrade Plan for More Storage
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}


            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Perfect Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Select the plan that best fits your business needs. All plans include core features with different limits and capabilities.
            </p>

            {/* Try Everything Free Banner */}
            {!currentSubscription && (
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-6 px-4 rounded-xl mb-8">
                <h3 className="text-xl font-bold text-white mb-2">
                  Try Everything Free
                </h3>
                <p className="text-green-100 mb-4">
                  No credit card required • Cancel anytime
                </p>
                <Button
                  className="bg-white text-green-700 hover:bg-gray-100 px-6 py-2 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(hideRegistration ? '/login' : '/signup')}
                >
                  {hideRegistration ? 'Sign In' : 'Start Free Trial'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Card className="border border-gray-200 shadow-sm mb-8">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Number of Users</Label>
                  <Input
                    type="number"
                    min="1"
                    value={selectedUsersInput}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      setSelectedUsersInput(rawValue);

                      if (rawValue === "") return;

                      const nextValue = parseInt(rawValue, 10);
                      if (!Number.isNaN(nextValue)) {
                        setSelectedUsers(Math.max(1, nextValue));
                      }
                    }}
                    onBlur={() => {
                      const nextValue = parseInt(selectedUsersInput, 10);
                      const normalizedValue = Number.isNaN(nextValue)
                        ? 1
                        : Math.max(1, nextValue);

                      setSelectedUsers(normalizedValue);
                      setSelectedUsersInput(String(normalizedValue));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Billing Cycle</Label>
                  <Select
                    value={selectedBillingCycle}
                    onValueChange={(value) => setSelectedBillingCycle(value as 'monthly' | 'yearly')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </CardContent>
          </Card>
          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => {
                const isMostPopular = plan.name.toLowerCase() === 'standard';
                const isCurrentPlan = !!currentSubscription && (
                  currentSubscription.plan_id === plan.id ||
                  currentSubscription.plan_name?.toLowerCase() === plan.name.toLowerCase()
                );
                const isLockedCurrentPlan = hasPaidSubscription && isCurrentPlan;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-gradient-to-br ${getPlanGradient(plan.name)} rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${isLockedCurrentPlan ? 'opacity-80 hover:shadow-lg' : 'hover:shadow-xl hover:scale-105'
                      } ${isMostPopular ? 'border-2 border-orange-400 ring-4 ring-orange-100' : 'border border-gray-200'
                      }`}
                  >
                    {isMostPopular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                        Most Popular
                      </div>
                    )}

                    {isLockedCurrentPlan && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gray-900 text-white">Current Plan</Badge>
                      </div>
                    )}

                    <div className={`${isLockedCurrentPlan ? 'blur-[1px]' : ''}`}>
                      <div className={`p-6 sm:p-8 ${isMostPopular ? 'pt-10 sm:pt-12' : 'pt-6 sm:pt-8'}`}>
                        {/* User Icon */}
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-md">
                            {getPlanIcon(plan.name)}
                          </div>
                        </div>

                        {/* Plan Name */}
                        <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-4">
                          {plan.name}
                        </h3>

                        {/* Price */}
                        {(() => {
                          const pricing = getPricingSummary(plan, selectedUsers, selectedBillingCycle);
                          return (
                            <div className="text-center mb-6">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className={`text-4xl sm:text-5xl font-bold ${getPlanAccentText(plan.name)}`}>
                                  {formatCurrency(pricing.effectivePerUser)}
                                </span>
                                <span className="text-gray-600 text-lg">/user/month</span>
                              </div>
                              <span className="text-gray-500 text-sm block mt-2">
                                Per user monthly: {formatCurrency(pricing.monthlyPerUser)}
                                {selectedBillingCycle === 'yearly' ? ` • Per user yearly billing: ${formatCurrency(pricing.yearlyPerUserMonthly)} / month` : ''}
                              </span>
                              {selectedBillingCycle === 'yearly' && (
                                <span className="text-emerald-600 text-sm block">
                                  Yearly price configured for this package: {formatCurrency(pricing.yearlyPerUserMonthly)} / month
                                </span>
                              )}
                              <span className="text-gray-500 text-sm block">
                                Total {selectedBillingCycle}: {formatCurrency(pricing.totalPrice)} for {selectedUsers} users
                              </span>
                            </div>
                          );
                        })()}

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

                        {/* CTA Button */}
                        {isLockedCurrentPlan ? (
                          <Button
                            className="w-full py-3 px-4 font-semibold text-sm sm:text-base whitespace-normal text-center bg-gray-200 text-gray-700 cursor-not-allowed"
                            disabled
                          >
                            <span className="flex items-center justify-center">
                              Current Plan
                            </span>
                          </Button>
                        ) : !currentSubscription ? (
                          <Button
                            className={`w-full py-3 px-4 font-semibold transition-all duration-200 text-sm sm:text-base whitespace-normal text-center ${isMostPopular
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            onClick={() => handleStartTrial(plan.id)}
                          >
                            <span className="flex items-center justify-center">
                              Try Everything Free!
                              <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
                            </span>
                          </Button>
                        ) : (currentSubscription.status === 'trial' && currentSubscription.is_trial_active) ? (
                          <Button
                            className={`w-full py-3 px-4 font-semibold transition-all duration-200 text-sm sm:text-base whitespace-normal text-center ${isMostPopular
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowPaymentModal(true);
                            }}
                          >
                            <span className="flex items-center justify-center">
                              Upgrade Now
                              <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
                            </span>
                          </Button>
                        ) : isTrialExpired ? (
                          <Button
                            className={`w-full py-3 px-4 font-semibold transition-all duration-200 text-sm sm:text-base whitespace-normal text-center ${isMostPopular
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowPaymentModal(true);
                            }}
                          >
                            <span className="flex items-center justify-center">
                              Subscribe Now
                              <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
                            </span>
                          </Button>
                        ) : (
                          <Button
                            className={`w-full py-3 px-4 font-semibold border-2 transition-all duration-200 text-sm sm:text-base whitespace-normal text-center ${isMostPopular
                                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            variant="outline"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowPaymentModal(true);
                            }}
                          >
                            <span className="flex items-center justify-center">
                              Upgrade to {plan.name}
                              <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
                            </span>
                          </Button>
                        )}

                        {/* Trial Information */}
                        {!currentSubscription && (
                          <div className="text-center mt-4">
                            <p className="text-gray-600 text-sm">
                              {plan.trial_days} days free trial
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Available</h3>
                  <p className="text-gray-600 mb-4">No subscription plans are available at the moment.</p>
                  <p className="text-sm text-gray-500">Please contact our support team for assistance with custom plans.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {currentSubscription && addons.length > 0 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add-on Packages</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Buy only the extra modules you need on top of your current plan.
              </p>
            </div>

            <Card className="border border-gray-200 shadow-sm mb-8">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Add-on Seats</Label>
                    <Input
                      type="number"
                      min="1"
                      value={selectedAddonUsersInput}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        setSelectedAddonUsersInput(rawValue);

                        if (rawValue === "") return;

                        const nextValue = parseInt(rawValue, 10);
                        if (!Number.isNaN(nextValue)) {
                          setSelectedAddonUsers(Math.max(1, nextValue));
                        }
                      }}
                      onBlur={() => {
                        const nextValue = parseInt(selectedAddonUsersInput, 10);
                        const normalizedValue = Number.isNaN(nextValue)
                          ? 1
                          : Math.max(1, nextValue);

                        setSelectedAddonUsers(normalizedValue);
                        setSelectedAddonUsersInput(String(normalizedValue));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Add-on Billing Cycle</Label>
                    <Select
                      value={selectedAddonBillingCycle}
                      onValueChange={(value) => setSelectedAddonBillingCycle(value as 'monthly' | 'yearly')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {addons.map((addon) => {
                const pricing = getAddonPricingSummary(addon, selectedAddonUsers, selectedAddonBillingCycle);
                const activeAssignment = addonAssignments.find(
                  (assignment) =>
                    assignment.addon_id === addon.id ||
                    assignment.module_key === addon.module_key ||
                    assignment.name?.toLowerCase() === addon.name.toLowerCase()
                );
                const alreadyActive = currentSubscription.addons?.some(
                  (activeAddon) =>
                    activeAddon.addon_id === addon.id ||
                    activeAddon.module_key === addon.module_key ||
                    activeAddon.name?.toLowerCase() === addon.name.toLowerCase()
                );

                return (
                  <div
                    key={addon.id}
                    className={`relative rounded-2xl border bg-white shadow-lg overflow-hidden transition-all duration-300 ${
                      alreadyActive ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {alreadyActive && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-emerald-600 text-white">Active Add-on</Badge>
                      </div>
                    )}

                    <div className="p-6 sm:p-8">
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center shadow-md">
                          <PackagePlus className="w-8 h-8 text-[#17c491]" />
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-2">
                        {addon.name}
                      </h3>
                      <p className="text-center text-xs font-medium uppercase text-gray-500 mb-5">
                        {addon.module_key || 'module add-on'}
                      </p>

                      <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl sm:text-5xl font-bold text-[#17c491]">
                            {formatCurrency(pricing.pricePerUser)}
                          </span>
                          <span className="text-gray-600 text-lg">/user/month</span>
                        </div>
                        <span className="text-gray-500 text-sm block mt-2">
                          Total {selectedAddonBillingCycle}: {formatCurrency(pricing.totalPrice)} for {selectedAddonUsers} seats
                        </span>
                      </div>

                      {addon.description && (
                        <div className="flex items-center justify-between py-2 mb-6">
                          <span className="text-gray-700 text-sm flex-1">{addon.description}</span>
                          <div className="flex items-center justify-center w-6 h-6">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        className={`w-full py-3 px-4 font-semibold text-sm sm:text-base whitespace-normal text-center ${
                          alreadyActive
                            ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                            : 'bg-[#17c491] hover:bg-[#0fa372] text-white'
                        }`}
                        disabled={alreadyActive}
                        onClick={() => {
                          setSelectedAddon(addon);
                          setShowAddonPaymentModal(true);
                        }}
                      >
                        {alreadyActive ? 'Already Active' : 'Buy Add-on'}
                        {!alreadyActive && <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />}
                      </Button>

                      {alreadyActive && activeAssignment && (
                        <div className="mt-5 rounded-lg border border-emerald-200 bg-white p-4 text-left">
                          {(() => {
                            const selectedIds = assignmentSelections[activeAssignment.id] || [];
                            const isExpanded = Boolean(expandedAddonAssignments[activeAssignment.id]);
                            return (
                              <>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              className="flex flex-1 items-center justify-between gap-3 text-left"
                              onClick={() => toggleAddonAssignmentPanel(activeAssignment.id)}
                            >
                              <span>
                                <span className="block text-sm font-semibold text-gray-900">Assign Employees</span>
                                <span className="block text-xs text-gray-500">
                                  {selectedIds.length}/{activeAssignment.users_count} users assigned
                                </span>
                              </span>
                              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                              <Button
                                size="sm"
                                className="bg-[#17c491] hover:bg-[#0fa372]"
                                disabled={savingAssignmentId === activeAssignment.id}
                                onClick={() => handleSaveAddonUsers(activeAssignment.id)}
                              >
                                {savingAssignmentId === activeAssignment.id ? 'Saving...' : 'Save Users'}
                              </Button>
                            )}
                          </div>

                          {isExpanded && employees.length > 0 ? (
                            <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1">
                              {employees.map((employee) => {
                                const employeeId = Number(employee.id);
                                const checked = selectedIds.includes(employeeId);
                                return (
                                  <label
                                    key={employee.id}
                                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${
                                      checked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-1"
                                      checked={checked}
                                      onChange={() => toggleAddonEmployee(activeAssignment.id, employeeId, activeAssignment.users_count)}
                                    />
                                    <span>
                                      <span className="block font-medium text-gray-900">{getEmployeeDisplayName(employee)}</span>
                                      <span className="block text-xs text-gray-500">
                                        {employee.employee_id || employee.email || '-'}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : isExpanded ? (
                            <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                              Employee list is not available. Login as admin/HR to assign users.
                            </div>
                          ) : null}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Payment History */}
        {payments && payments.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/90">
            <CardHeader className="bg-gradient-to-r from-[#17c491] to-[#0fa372] text-white rounded-t-xl">
              <CardTitle className="text-white">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Method</th>
                      <th className="text-left p-2">Transaction ID</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                        <td className="p-2">₹{payment.amount.toLocaleString()}</td>
                        <td className="p-2">{payment.payment_method}</td>
                        <td className="p-2">{payment.transaction_id}</td>
                        <td className="p-2">
                          <Badge className={
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                          }>
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      </div>
                      <Badge className={
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">{payment.payment_method}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium text-xs break-all">{payment.transaction_id}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
                <p className="text-sm text-gray-600">
                  Upgrade to {selectedPlan.name} plan
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{selectedPlan.name}</p>
                  <div className="flex items-baseline gap-2">
                    {(() => {
                      const pricing = getPricingSummary(selectedPlan, selectedUsers, selectedBillingCycle);
                      return (
                        <>
                          <span className="text-2xl font-bold">{formatCurrency(pricing.effectivePerUser)}</span>
                          <span className="text-gray-600">/user/month</span>
                          <span className="text-sm text-gray-500 ml-auto">
                            Total {selectedBillingCycle}: {formatCurrency(pricing.totalPrice)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedUsers} subscribed users. You can add up to {selectedUsers} employees after payment.
                  </p>
                  {selectedBillingCycle === 'yearly' && (
                    <p className="text-sm text-emerald-600">
                      Yearly price comes directly from the saved package configuration.
                    </p>
                  )}
                  <p className="text-sm text-gray-600">{getStorageForPlan(selectedPlan)} storage</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpgrade}
                    className="flex-1"
                    disabled={isPaying}
                  >
                    {isPaying ? 'Starting Payment...' : 'Pay with Razorpay'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedPlan(null);
                    }}
                    disabled={isPaying}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showAddonPaymentModal && selectedAddon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Complete Add-on Payment</CardTitle>
                <p className="text-sm text-gray-600">
                  Buy {selectedAddon.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{selectedAddon.name}</p>
                  <div className="flex items-baseline gap-2">
                    {(() => {
                      const pricing = getAddonPricingSummary(selectedAddon, selectedAddonUsers, selectedAddonBillingCycle);
                      return (
                        <>
                          <span className="text-2xl font-bold">{formatCurrency(pricing.pricePerUser)}</span>
                          <span className="text-gray-600">/user/month</span>
                          <span className="text-sm text-gray-500 ml-auto">
                            Total {selectedAddonBillingCycle}: {formatCurrency(pricing.totalPrice)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedAddonUsers} add-on seats for this module.
                  </p>
                  {selectedAddon.description && (
                    <p className="text-sm text-gray-600">{selectedAddon.description}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleBuyAddon}
                    className="flex-1"
                    disabled={isAddonPaying}
                  >
                    {isAddonPaying ? 'Starting Payment...' : 'Pay with Razorpay'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddonPaymentModal(false);
                      setSelectedAddon(null);
                    }}
                    disabled={isAddonPaying}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionManagement;
