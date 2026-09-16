import React, { useEffect, useState } from 'react';
import { X, Crown, CreditCard, Users, CheckCircle, AlertTriangle, Star, Zap, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import ENDPOINTS from '../lib/endpoint';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearly_price?: number;
  max_users: number;
  trial_days: number;
  is_active: boolean;
}

interface TrialExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialEndDate?: string;
  currentUsers?: number;
}

const TrialExpirationModal: React.FC<TrialExpirationModalProps> = ({
  isOpen,
  onClose,
  trialEndDate,
  currentUsers = 0
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const response = await ENDPOINTS.getSubscriptionPlans();
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      setSubscribing(true);
      setSelectedPlan(plan);

      const orderResponse = await ENDPOINTS.createSubscriptionUpgradeOrder({
        plan_id: plan.id,
        users_count: Math.max(currentUsers, 1),
        billing_cycle: 'monthly'
      });

      if (orderResponse.data.success) {
        const options = {
          key: orderResponse.data.key_id,
          amount: orderResponse.data.amount,
          currency: orderResponse.data.currency,
          name: 'HRMS Subscription',
          description: `${plan.name} Plan`,
          order_id: orderResponse.data.order_id,
          handler: function () {
            window.location.href = '/subscription/success';
          },
          modal: {
            ondismiss: function () {
              setSubscribing(false);
              setSelectedPlan(null);
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Error initiating subscription:', error);
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const getPopularPlan = () =>
    plans.find((plan) => plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('standard'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white">
        <div className="rounded-t-2xl bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white bg-opacity-20 p-3">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Subscribe to Continue</h1>
                <p className="text-red-100">
                  An active subscription is required. Choose a plan to continue using HRMS.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white transition-colors hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">Current Usage</p>
                  <p className="text-sm text-orange-600">
                    You have {currentUsers} employee{currentUsers !== 1 ? 's' : ''} in your account
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <h2 className="mb-4 text-center text-xl font-bold">Choose Your Plan</h2>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="rounded-lg border p-6">
                      <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
                      <div className="mb-4 h-8 w-1/2 rounded bg-gray-200"></div>
                      <div className="space-y-2">
                        <div className="h-3 rounded bg-gray-200"></div>
                        <div className="h-3 w-5/6 rounded bg-gray-200"></div>
                        <div className="h-3 w-4/6 rounded bg-gray-200"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                  const isPopular = getPopularPlan()?.id === plan.id;
                  const isSubscribing = subscribing && selectedPlan?.id === plan.id;

                  return (
                    <Card key={plan.id} className={`relative ${isPopular ? 'border-blue-500 shadow-lg' : ''}`}>
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                          <div className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                            <Star className="h-3 w-3" />
                            MOST POPULAR
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-3 text-center">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold">Rs. {plan.price}</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          {plan.yearly_price !== undefined && plan.yearly_price !== null && (
                            <p className="text-sm text-gray-500">Yearly: Rs. {plan.yearly_price}/month</p>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </CardHeader>

                      <CardContent>
                        <div className="mb-6 space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{plan.max_users} Users</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm">All Features Included</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Priority Support</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Advanced Analytics</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleSubscribe(plan)}
                          disabled={isSubscribing}
                          className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        >
                          {isSubscribing ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Subscribe Now
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Crown className="h-5 w-5 text-yellow-600" />
                Why Upgrade to Premium?
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Unlimited Employee Management</p>
                    <p className="text-sm text-gray-600">Add as many employees as your business needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Advanced HR Features</p>
                    <p className="text-sm text-gray-600">Payroll, attendance, performance management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Priority Customer Support</p>
                    <p className="text-sm text-gray-600">24/7 dedicated support team</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Data Security & Backup</p>
                    <p className="text-sm text-gray-600">Enterprise-grade security and daily backups</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Maybe Later
            </Button>
            <Button
              onClick={() => (window.location.href = '/subscription/plans')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 sm:flex-none"
            >
              View All Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpirationModal;
