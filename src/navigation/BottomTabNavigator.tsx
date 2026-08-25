import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { HomeScreen, BookingsScreen, ProfileScreen, MenuScreen } from '@/screens';
import { BottomTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: '#93c5fd',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 72 : 54,
          paddingBottom: Platform.OS === 'ios' ? 18 : 4,
          paddingTop: 5,
          backgroundColor: '#0066ff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat_600SemiBold',
          fontSize: 10.5,
          letterSpacing: 0.1,
        },
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
          return <Ionicons name={iconName} size={22} color={color} />;
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
      <Tab.Screen name="MenuTab" component={MenuScreen} options={{ title: 'Menu' }} />
    </Tab.Navigator>
  );
};
