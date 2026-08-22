import React, { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { AuthProvider, useAuth } from "../../context/AuthContext";

import { HomeScreen } from "../../features/home/screens/HomeScreen";
import { UnreservedScreen } from "../../features/unreserved/screens/UnreservedScreen";
import { BookingConfigScreen } from "../../features/unreserved/screens/BookingConfigScreen";
import { TicketScreen } from "../../features/unreserved/screens/TicketScreen";
import { BookingsScreen } from "../../features/bookings/screens/BookingsScreen";
import { ProfileScreen } from "../../features/profile/screens/ProfileScreen";
import { LoginScreen } from "../../features/auth/screens/LoginScreen";
import { MenuDrawer } from "../../components/common/MenuDrawer";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs({ onMenuPress }: { onMenuPress: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: "#93c5fd",
        tabBarStyle: {
          height: 60, paddingBottom: 8, paddingTop: 8,
          backgroundColor: "#0066ff", borderTopWidth: 0, elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === "HomeTab") iconName = focused ? "home" : "home-outline";
          else if (route.name === "BookingsTab") iconName = focused ? "ticket" : "ticket-outline";
          else if (route.name === "ProfileTab") iconName = focused ? "person" : "person-outline";
          else iconName = focused ? "menu" : "menu-outline";
          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen
        name="BookingsTab" component={BookingsScreen}
        options={{ title: "My Bookings", tabBarStyle: { display: "none" } }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "You" }} />
      <Tab.Screen
        name="MenuTab" component={HomeScreen}
        options={{
          title: "Menu",
          tabBarButton: (props) => (
            <TouchableOpacity {...(props as any)} onPress={onMenuPress} style={props.style} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8faff" }}>
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
          {() => <BottomTabs onMenuPress={() => setMenuVisible(true)} />}
        </Stack.Screen>
        <Stack.Screen name="Unreserved" component={UnreservedScreen} />
        <Stack.Screen name="BookingConfig" component={BookingConfigScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
      </Stack.Navigator>
      <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </NavigationContainer>
  );
}

export const RootNavigator = () => (
  <AuthProvider>
    <AppNavigator />
  </AuthProvider>
);
