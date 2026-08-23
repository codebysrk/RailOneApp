import React, { useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { LoginScreen } from '@/screens';
import { UnreservedScreen, BookingConfigScreen, TicketScreen } from '@/screens';
import { NotificationScreen } from '@/screens';
import { MenuDrawer } from '@/components/common/MenuDrawer';
import { BottomTabNavigator } from '@/navigation/BottomTabNavigator';
import { RootStackParamList } from '@/types/navigation';

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
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 220,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animationTypeForReplace: 'push',
          orientation: 'portrait',
        }}
      >
        <Stack.Screen
          name="Main"
          options={{
            animation: 'fade',
          }}
        >
          {() => <BottomTabNavigator onMenuPress={() => setMenuVisible(true)} />}
        </Stack.Screen>

        <Stack.Screen
          name="Unreserved"
          component={UnreservedScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="BookingConfig"
          component={BookingConfigScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Ticket"
          component={TicketScreen}
          options={{
            animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
            gestureEnabled: false, // Prevent accidental swipe back during active ticket verification
          }}
        />

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
