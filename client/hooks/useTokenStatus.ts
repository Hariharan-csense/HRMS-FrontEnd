import { useState, useEffect } from 'react';
import { isTokenExpiredOrExpiringSoon } from '../lib/endpoint';

interface TokenStatus {
  isValid: boolean;
  isExpiringSoon: boolean;
  timeUntilExpiry: number | null;
}

export const useTokenStatus = (): TokenStatus => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    isValid: false,
    isExpiringSoon: false,
    timeUntilExpiry: null,
  });

  useEffect(() => {
    const checkTokenStatus = () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setTokenStatus({
          isValid: false,
          isExpiringSoon: false,
          timeUntilExpiry: null,
        });
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = payload.exp;
        const timeUntilExpiry = expirationTime - currentTime;
        
        setTokenStatus({
          isValid: timeUntilExpiry > 0,
          isExpiringSoon: isTokenExpiredOrExpiringSoon(token),
          timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : null,
        });
      } catch (error) {
        console.error('Error checking token status:', error);
        setTokenStatus({
          isValid: false,
          isExpiringSoon: false,
          timeUntilExpiry: null,
        });
      }
    };

    // Check immediately
    checkTokenStatus();

    // Check every minute
    const interval = setInterval(checkTokenStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return tokenStatus;
};
