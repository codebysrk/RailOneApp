import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Pressable, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { HomeScreen, BookingsScreen, ProfileScreen, MenuScreen } from '@/screens';
import { BottomTabParamList } from '@/types/navigation';
import { MenuDrawer } from '@/components/common/MenuDrawer';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const tabHeight = (Platform.OS === 'ios' ? 56 : 56) + insets.bottom;
  const tabPaddingBottom = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 14 : 5);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.white,
          tabBarInactiveTintColor: '#93c5fd',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: tabHeight,
            paddingBottom: tabPaddingBottom,
            paddingTop: 6,
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
            marginTop: -1,
          },
          tabBarIconStyle: {
            marginBottom: -1,
          },
          tabBarButton: (props) => (
            Platform.OS === 'android' ? (
              <Pressable
                {...(props as any)}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.22)', borderless: true }}
                style={props.style}
              />
            ) : (
              <TouchableOpacity
                {...(props as any)}
                activeOpacity={0.7}
                style={props.style}
              />
            )
          ),
          tabBarIcon: ({ color }) => {
            const ICON_SIZE = 26;
            let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

            if (route.name === 'HomeTab') {
              iconName = 'home-outline';
            } else if (route.name === 'BookingsTab') {
              iconName = 'ticket-outline';
            } else if (route.name === 'ProfileTab') {
              iconName = 'account-outline';
            } else {
              iconName = 'menu';
            }

            return <MaterialCommunityIcons name={iconName} size={ICON_SIZE} color={color} />;
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

        {/* Menu tab — intercept press to open drawer, don't navigate to screen */}
        <Tab.Screen
          name="MenuTab"
          component={MenuScreen}
          options={{
            title: 'Menu',
            tabBarButton: (props) => (
              <TouchableOpacity
                style={props.style}
                activeOpacity={0.7}
                onPress={openMenu}
              >
                {props.children}
              </TouchableOpacity>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Drawer renders as a native Modal overlay — always on top */}
      <MenuDrawer visible={menuVisible} onClose={closeMenu} />
    </>
  );
};
