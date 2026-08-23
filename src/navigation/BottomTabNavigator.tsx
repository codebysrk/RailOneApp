import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { HomeScreen } from '@/screens';
import { BookingsScreen } from '@/screens';
import { ProfileScreen } from '@/screens';
import { BottomTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface BottomTabsProps {
  onMenuPress: () => void;
}

export const BottomTabNavigator: React.FC<BottomTabsProps> = ({ onMenuPress }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: '#93c5fd',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          backgroundColor: '#0066ff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.1 },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...(props as any)}
            activeOpacity={0.7}
            style={props.style}
          />
        ),
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'BookingsTab') iconName = focused ? 'ticket' : 'ticket-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          else iconName = focused ? 'menu' : 'menu-outline';
          return <Ionicons name={iconName} size={25} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsScreen}
        options={{ title: 'My Bookings', tabBarStyle: { display: 'none' } }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'You' }} />
      <Tab.Screen
        name="MenuTab"
        component={HomeScreen}
        options={{
          title: 'Menu',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...(props as any)}
              activeOpacity={0.7}
              onPress={onMenuPress}
              style={props.style}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
