import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { OfflineBanner } from '@/components/common';
import { AppNavigator } from '@/navigation/AppNavigator';

export const RootNavigator: React.FC = () => {
  return (
    <NetworkProvider>
      <AuthProvider>
        <OfflineBanner />
        <AppNavigator />
      </AuthProvider>
    </NetworkProvider>
  );
};

