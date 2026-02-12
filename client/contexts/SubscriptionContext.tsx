import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ENDPOINTS from '../lib/endpoint';
import TrialExpirationModal from '../components/TrialExpirationModal';

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

interface SubscriptionContextType {
  subscription: CompanySubscription | null;
  loading: boolean;
  error: string | null;
  checkSubscriptionStatus: () => Promise<void>;
  showTrialExpirationModal: boolean;
  setShowTrialExpirationModal: (show: boolean) => void;
  isTrialExpired: boolean;
  isTrialEndingSoon: boolean;
  isUserLimitExceeded: boolean;
  currentEmployeeCount: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

// Helper function to check if user is authenticated
const isUserAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  const user = localStorage.getItem("user");
  return !!(token && user);
};

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrialExpirationModal, setShowTrialExpirationModal] = useState(false);
  const [currentEmployeeCount, setCurrentEmployeeCount] = useState(0);

  const checkSubscriptionStatus = async () => {
    // Check if user is authenticated before making the request
    if (!isUserAuthenticated()) {
      console.log('User not authenticated, skipping subscription check');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ENDPOINTS.getCurrentSubscription();
      
      if (response.data.success) {
        const subscriptionData = response.data.data;
        setSubscription(subscriptionData);
        
        // Check if trial has expired
        if (subscriptionData?.status === 'expired' || 
            (subscriptionData?.status === 'trial' && subscriptionData?.trial_days_remaining <= 0)) {
          setShowTrialExpirationModal(true);
        }
        
        // Get current employee count
        try {
          const employeesResponse = await ENDPOINTS.getEmployee();
          if (employeesResponse.data?.data) {
            setCurrentEmployeeCount(employeesResponse.data.data.length);
          }
        } catch (empError) {
          console.error('Error fetching employee count:', empError);
        }
      } else {
        // No subscription found
        setShowTrialExpirationModal(true);
      }
    } catch (err: any) {
      console.error('Error checking subscription:', err);
      
      // Handle 401 Unauthorized specifically
      if (err.response?.status === 401) {
        console.log('Unauthorized access - user may need to login again');
        // Don't show trial modal for 401, just clear error
        setError(null);
        return;
      }
      
      // Check if error is related to subscription
      if (err.response?.status === 403) {
        const errorData = err.response.data;
        
        if (errorData?.requires_subscription || errorData?.trial_expired) {
          setShowTrialExpirationModal(true);
        } else if (errorData?.user_limit_exceeded) {
          // Show user limit exceeded modal or notification
          setShowTrialExpirationModal(true);
        }
      }
      
      setError(err.response?.data?.message || 'Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure auth context is initialized
    const timer = setTimeout(() => {
      checkSubscriptionStatus();
    }, 100);
    
    // Set up periodic subscription checks (every 5 minutes) - only if authenticated
    const interval = setInterval(() => {
      if (isUserAuthenticated()) {
        checkSubscriptionStatus();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const isTrialExpired = subscription?.status === 'expired' || 
                       (subscription?.status === 'trial' && subscription?.trial_days_remaining <= 0);

  const isTrialEndingSoon = subscription?.status === 'trial' && 
                           subscription?.trial_days_remaining > 0 && 
                           subscription?.trial_days_remaining <= 2;

  const isUserLimitExceeded = currentEmployeeCount >= (subscription?.max_users || subscription?.plan_max_users || 0);

  const value: SubscriptionContextType = {
    subscription,
    loading,
    error,
    checkSubscriptionStatus,
    showTrialExpirationModal,
    setShowTrialExpirationModal,
    isTrialExpired,
    isTrialEndingSoon,
    isUserLimitExceeded,
    currentEmployeeCount,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <TrialExpirationModal
        isOpen={showTrialExpirationModal}
        onClose={() => setShowTrialExpirationModal(false)}
        trialEndDate={subscription?.trial_end_date}
        currentUsers={currentEmployeeCount}
      />
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
