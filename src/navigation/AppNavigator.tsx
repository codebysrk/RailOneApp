import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../features/auth';
import { UnreservedScreen, BookingConfigScreen, TicketScreen } from '../features/unreserved';
import { NotificationScreen } from '../features/notifications';
import { MenuDrawer } from '../components/common/MenuDrawer';
import { BottomTabNavigator } from './BottomTabNavigator';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8faff' }}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {() => <BottomTabNavigator onMenuPress={() => setMenuVisible(true)} />}
        </Stack.Screen>
        <Stack.Screen name="Unreserved" component={UnreservedScreen} />
        <Stack.Screen name="BookingConfig" component={BookingConfigScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen
          name="Notification"
          component={NotificationScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
      <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </NavigationContainer>
  );
};

