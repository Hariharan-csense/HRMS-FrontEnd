import React, { useState, useEffect } from 'react';
import { X, Crown, CreditCard, Users, Clock, CheckCircle, AlertTriangle, Star, Zap, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import ENDPOINTS from '../lib/endpoint';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  max_users: number;
  trial_days: number;
  billing_cycle: string;
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
      
      // Create payment order
      const orderResponse = await ENDPOINTS.createSubscriptionUpgradeOrder(plan.id);
      
      if (orderResponse.data.success) {
        // Redirect to payment or open payment modal
        const options = {
          key: orderResponse.data.key_id,
          amount: orderResponse.data.amount,
          currency: orderResponse.data.currency,
          name: 'HRMS Subscription',
          description: `${plan.name} Plan`,
          order_id: orderResponse.data.order_id,
          handler: function (response: any) {
            // Handle payment success
            window.location.href = '/subscription/success';
          },
          modal: {
            ondismiss: function() {
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

  const getPopularPlan = () => plans.find(plan => plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('standard'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Your Free Trial Has Ended</h1>
                <p className="text-red-100">
                  {trialEndDate ? `Trial ended on ${new Date(trialEndDate).toLocaleDateString()}` : 'Trial period has expired'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Current Status */}
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">Current Usage</p>
                  <p className="text-sm text-orange-600">You have {currentUsers} employee{currentUsers !== 1 ? 's' : ''} in your account</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-center">Choose Your Plan</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="border rounded-lg p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isPopular = getPopularPlan()?.id === plan.id;
                  const isSubscribing = subscribing && selectedPlan?.id === plan.id;
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`relative ${isPopular ? 'border-blue-500 shadow-lg' : ''}`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            MOST POPULAR
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-3">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-bold">₹{plan.price}</span>
                          <span className="text-gray-500">/{plan.billing_cycle}</span>
                        </div>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{plan.max_users} Users</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-sm">All Features Included</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Priority Support</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
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
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
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

          {/* Benefits Section */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Why Upgrade to Premium?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Unlimited Employee Management</p>
                    <p className="text-sm text-gray-600">Add as many employees as your business needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Advanced HR Features</p>
                    <p className="text-sm text-gray-600">Payroll, attendance, performance management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Priority Customer Support</p>
                    <p className="text-sm text-gray-600">24/7 dedicated support team</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Data Security & Backup</p>
                    <p className="text-sm text-gray-600">Enterprise-grade security and daily backups</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Maybe Later
            </Button>
            <Button 
              onClick={() => window.location.href = '/subscription/plans'}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
