import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ENDPOINTS from '@/lib/endpoint';
import { hasActiveLoginSubscription } from '@/utils/loginSubscription';

export default function PostLoginRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin' ||
    user?.roles?.some((role) => role.toLowerCase() === 'superadmin');

  useEffect(() => {
    if (isLoading || !isAuthenticated || isSuperAdmin) return;
    let cancelled = false;
    setError('');
    const goToSubscription = () => navigate('/dashboard', {
      replace: true, state: { showSubscriptionPrompt: true },
    });
    ENDPOINTS.getCurrentSubscription().then(({ data }) => {
      if (cancelled) return;
      if (!data.success) throw new Error('Unable to check your subscription. Please retry.');
      if (hasActiveLoginSubscription(data.data)) navigate('/attendance/capture', { replace: true });
      else goToSubscription();
    }).catch((err) => {
      if (cancelled) return;
      if (err.response?.status === 403 &&
        (err.response?.data?.requires_subscription || err.response?.data?.trial_expired)) {
        goToSubscription();
      } else {
        setError('Unable to check your subscription. Please retry.');
      }
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, isSuperAdmin, user?.id, user?.company_id, navigate, retry]);

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />;
  if (!isLoading && isSuperAdmin) return <Navigate to="/superadmin-dashboard" replace />;
  return <div className="flex min-h-screen items-center justify-center bg-background p-6">
    <div className="text-center" role={error ? 'alert' : 'status'}>
      <p>{error || 'Checking your subscription…'}</p>
      {error && <button className="mt-4 rounded-lg bg-teal-600 px-5 py-2 text-white" onClick={() => setRetry((value) => value + 1)}>Retry</button>}
    </div>
  </div>;
}
