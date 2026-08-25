import React, { useState } from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { LoginScreen, UnreservedScreen, BookingConfigScreen, TicketScreen, NotificationScreen, LanguageScreen } from '@/screens';
import { MenuDrawer } from '@/components/common/MenuDrawer';
import { BottomTabNavigator } from '@/navigation/BottomTabNavigator';
import { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

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
            <Stack.Screen name="Main" options={{ animation: 'fade' }}>
              {() => <BottomTabNavigator onMenuPress={() => setMenuVisible(true)} />}
            </Stack.Screen>
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
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                animationDuration: 260,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="Language"
              component={LanguageScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                animationDuration: 260,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>

      {user && <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashHolder: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

