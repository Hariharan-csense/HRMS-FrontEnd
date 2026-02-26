import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { profileManager } from '@/lib/profileManager';

interface AutoLoginHandlerProps {
  children: React.ReactNode;
}

export const AutoLoginHandler: React.FC<AutoLoginHandlerProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only check saved profile metadata on login page.
    // Never force-redirect from public pages like landing/forgot-password.
    if (!isLoading && !isAuthenticated) {
      if (location.pathname !== '/login') return;

      const savedProfile = profileManager.getSavedProfile();
      const savedCredentials = profileManager.getSavedCredentials();
      
      if (savedProfile && savedCredentials && savedCredentials.rememberMe) {
        console.log('Found saved profile for:', savedProfile.email);
      }
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  return <>{children}</>;
};

export default AutoLoginHandler;
