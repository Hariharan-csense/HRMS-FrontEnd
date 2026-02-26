import React from 'react';
import { useTokenStatus } from '../hooks/useTokenStatus';

interface TokenWarningProps {
  showWarning?: boolean;
}

export const TokenWarning: React.FC<TokenWarningProps> = ({ showWarning = false }) => {
  const { isValid, isExpiringSoon, timeUntilExpiry } = useTokenStatus();

  if (!showWarning || !isValid) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 9999,
        backgroundColor: isExpiringSoon ? '#ff6b6b' : '#51cf66',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div>Token: {isExpiringSoon ? 'Expiring Soon!' : 'Valid'}</div>
      {timeUntilExpiry && (
        <div>Expires in: {formatTime(timeUntilExpiry)}</div>
      )}
    </div>
  );
};
