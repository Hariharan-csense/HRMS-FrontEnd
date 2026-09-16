type LoginSubscription = {
  status?: string;
  is_internal_company?: boolean;
  is_trial_active?: boolean;
  trial_end_date?: string | null;
  end_date?: string | null;
};

export function hasActiveLoginSubscription(subscription: LoginSubscription | null, now = Date.now()): boolean {
  if (subscription?.is_internal_company) return true;
  if (!subscription) return false;
  const status = subscription.status?.toLowerCase();
  if (status === 'trial') {
    return subscription.is_trial_active === true &&
      (!subscription.trial_end_date || Date.parse(subscription.trial_end_date) > now);
  }
  return status === 'active' && !!subscription.end_date && Date.parse(subscription.end_date) > now;
}
