import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { LoginScreen, UnreservedScreen, BookingConfigScreen, TicketScreen, NotificationScreen, LanguageScreen, AdminScreen } from '@/screens';
import { BottomTabNavigator } from '@/navigation/BottomTabNavigator';
import { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={styles.splashHolder} />;
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
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} options={{ animation: 'fade' }} />
            <Stack.Screen name="Unreserved" component={UnreservedScreen} />
            <Stack.Screen name="BookingConfig" component={BookingConfigScreen} />
            <Stack.Screen
              name="Ticket"
              component={TicketScreen}
              options={{
                animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Notification"
              component={NotificationScreen}
              options={{
                presentation: 'transparentModal',
                animation: 'none',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Language"
              component={LanguageScreen}
              options={{
                presentation: 'transparentModal',
                animation: 'none',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="Admin" component={AdminScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashHolder: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
