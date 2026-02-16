import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { AlertCircle, CheckCircle, Clock, Users, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface CompanySubscription {
  id: number;
  plan_name: string;
  plan_description: string;
  plan_price: number;
  plan_max_users: number;
  start_date: string;
  end_date: string;
  trial_end_date?: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  max_users: number;
  paid_amount?: number;
  last_payment_date?: string;
  next_billing_date?: string;
  days_remaining: number;
  is_trial_active: boolean;
  trial_days_remaining: number;
}

interface SubscriptionStatusProps {
  compact?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ compact = false }) => {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

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
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">No Active Subscription</p>
              <p className="text-sm text-orange-600">Please subscribe to continue using the service</p>
            </div>
            <Button size="sm" onClick={() => navigate('/subscription')}>
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getStatusBadge(subscription.status)}
        <span className="text-gray-600">
          {subscription.plan_name} • {subscription.days_remaining} days left
        </span>
      </div>
    );
  }

  const isExpiringSoon = subscription.days_remaining <= 7;
  const isExpired = subscription.status === 'expired';
  const isTrialExpired = subscription.status === 'trial' && !subscription.is_trial_active;

  return (
    <Card className={isExpired || isTrialExpired ? 'border-red-200 bg-red-50' : isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          Subscription Status
          {getStatusBadge(isTrialExpired ? 'expired' : subscription.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Current Plan</p>
            <p className="font-semibold">{subscription.plan_name}</p>
            <p className="text-sm text-gray-500">{subscription.plan_description}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Users</p>
            <p className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              {subscription.plan_max_users} Users
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {subscription.days_remaining} days remaining
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Billing</p>
            <p className="font-semibold">
              {subscription.next_billing_date ? 
                new Date(subscription.next_billing_date).toLocaleDateString() : 
                'N/A'
              }
            </p>
          </div>
        </div>
        
        {subscription.is_trial_active && !isTrialExpired && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <Clock className="inline w-4 h-4 mr-1" />
              Trial ends in {subscription.trial_days_remaining} days
            </p>
          </div>
        )}

        {isTrialExpired && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Your free trial has ended. Subscribe now to continue using the service.
            </p>
          </div>
        )}

        {isExpiringSoon && !isExpired && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <AlertTriangle className="inline w-4 h-4 mr-1" />
              Your subscription expires in {subscription.days_remaining} days
            </p>
          </div>
        )}

        {isExpired && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Your subscription has expired. Please renew to continue using the service.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/subscription')}
            className="flex-1"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isExpired || isTrialExpired ? 'Subscribe Now' : 'Manage Subscription'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
