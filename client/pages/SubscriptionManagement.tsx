import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Users, CreditCard, Calendar, Star, Zap, Shield, Crown, X, ChevronRight, Check } from 'lucide-react';
import { Layout } from '@/components/Layout';
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
}

interface CompanySubscription {
  id: number;
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

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    console.log('fetchSubscriptionData called');
    try {
      console.log('Making API calls...');
      const [plansRes, subscriptionRes, paymentsRes] = await Promise.all([
        ENDPOINTS.getSubscriptionPlans(),
        ENDPOINTS.getCurrentSubscription(),
        ENDPOINTS.getSubscriptionPayments()
      ]);

      console.log('API responses received:', { plansRes, subscriptionRes, paymentsRes });

      setPlans(plansRes.data?.data || []);
      setCurrentSubscription(subscriptionRes.data?.data || null);
      setPayments(paymentsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      // Set default values to prevent undefined errors
      setPlans([]);
      setCurrentSubscription(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (planId: number) => {
    try {
      const response = await ENDPOINTS.startSubscriptionTrial(planId);
      showToast.success(response.data.message);
      fetchSubscriptionData();
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

      const orderRes = await ENDPOINTS.createSubscriptionUpgradeOrder(selectedPlan.id);
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
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            showToast.success(verifyRes.data?.message || 'Payment successful');
            setShowPaymentModal(false);
            setSelectedPlan(null);
            fetchSubscriptionData();
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

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('starter')) {
      return <Shield className="w-8 h-8 text-blue-500" />;
    }
    if (name.includes('pro') || name.includes('professional')) {
      return <Zap className="w-8 h-8 text-purple-500" />;
    }
    if (name.includes('enterprise') || name.includes('premium')) {
      return <Crown className="w-8 h-8 text-amber-500" />;
    }
    return <Star className="w-8 h-8 text-green-500" />;
  };

  const getPlanGradient = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('starter')) {
      return 'from-blue-50 to-indigo-50 border-blue-200';
    }
    if (name.includes('pro') || name.includes('professional')) {
      return 'from-purple-50 to-pink-50 border-purple-200';
    }
    if (name.includes('enterprise') || name.includes('premium')) {
      return 'from-amber-50 to-orange-50 border-amber-200';
    }
    return 'from-green-50 to-emerald-50 border-green-200';
  };

  const getButtonVariant = (planName: string, isUpgrade: boolean = false) => {
    const name = planName.toLowerCase();
    if (name.includes('enterprise') || name.includes('premium')) {
      return isUpgrade ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' : 'border-amber-500 text-amber-600 hover:bg-amber-50';
    }
    if (name.includes('pro') || name.includes('professional')) {
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
        </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Subscription
              {getStatusBadge(currentSubscription.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSubscription.status === 'trial' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  🎉 Welcome! Your free trial is active
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Enjoy full access to all features during your trial period. Choose a plan below to upgrade anytime and continue using the service without interruption.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold">{currentSubscription.plan_name}</p>
                <p className="text-sm text-gray-500">{currentSubscription.plan_description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {currentSubscription.plan_max_users} Users
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
                        className={`h-2 rounded-full ${
                          currentSubscription.storage_usage_percentage > 90 ? 'bg-red-500' :
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
              <div className={`mt-4 p-4 rounded-lg ${
                currentSubscription.storage_usage_percentage > 95 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`font-medium ${
                  currentSubscription.storage_usage_percentage > 95 ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {currentSubscription.storage_usage_percentage > 95 ? '⚠️ Critical: Storage Almost Full!' : '⚠️ Storage Running Low'}
                </p>
                <p className={`text-sm mt-1 ${
                  currentSubscription.storage_usage_percentage > 95 ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  You're using {currentSubscription.storage_usage_percentage}% of your {currentSubscription.storage_gb || currentSubscription.plan_storage_gb || 1}GB storage limit. 
                  {currentSubscription.storage_usage_percentage > 95 ? 
                    ' Upload files will be blocked. Upgrade immediately to continue using the service.' : 
                    ' Consider upgrading to a higher plan to avoid service interruption.'
                  }
                </p>
                <Button 
                  className={`mt-3 ${
                    currentSubscription.storage_usage_percentage > 95 ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
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
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-6 px-4 rounded-xl mb-8">
            <h3 className="text-xl font-bold text-white mb-2">
              Try Everything Free
            </h3>
            <p className="text-green-100 mb-4">
              No credit card required • Cancel anytime
            </p>
            <Button 
              className="bg-white text-green-700 hover:bg-gray-100 px-6 py-2 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/signup')}
            >
              Start Free Trial
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        {plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isMostPopular = plan.name.toLowerCase() === 'starter';
              
              return (
                <div 
                  key={plan.id} 
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                    isMostPopular ? 'border-2 border-orange-400 ring-4 ring-orange-100' : 'border border-gray-200'
                  }`}
                >
                  {isMostPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                      Most Popular
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
                        <span className="text-5xl font-bold text-gray-900">
                          {formatPrice(getYearlyPrice(plan.price))}
                        </span>
                        <span className="text-gray-600 text-lg">/year</span>
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
                    
                    {/* CTA Button */}
                    {!currentSubscription ? (
                      <Button 
                        className={`w-full py-3 font-semibold transition-all duration-200 ${
                          isMostPopular 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleStartTrial(plan.id)}
                      >
                        Try Everything Free!
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : currentSubscription.status === 'trial' ? (
                      <Button 
                        className={`w-full py-3 font-semibold transition-all duration-200 ${
                          isMostPopular 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowPaymentModal(true);
                        }}
                      >
                        Upgrade Now
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full py-3 font-semibold border-2 transition-all duration-200 ${
                          isMostPopular 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowPaymentModal(true);
                        }}
                      >
                        Upgrade to {plan.name}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    
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

      
      {/* Payment History */}
      {payments && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                  <span className="text-2xl font-bold">{formatPrice(getYearlyPrice(selectedPlan.price))}</span>
                  <span className="text-gray-600">/year</span>
                </div>
                <p className="text-sm text-gray-600">{selectedPlan.max_users} users</p>
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
      </div>
    </Layout>
  );
};

export default SubscriptionManagement;
