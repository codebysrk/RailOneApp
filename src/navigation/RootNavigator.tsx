import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { AppNavigator } from './AppNavigator';

export const RootNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

