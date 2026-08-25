import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

export type AdminTabType = 'dashboard' | 'users' | 'requests' | 'stations' | 'create-user' | 'bookings';

interface AdminTabsNavProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  pendingRequestsCount: number;
  stationsCount: number;
  usersCount: number;
  bookingsCount: number;
}

export const AdminTabsNav: React.FC<AdminTabsNavProps> = ({
  activeTab,
  setActiveTab,
  pendingRequestsCount,
  stationsCount,
  usersCount,
  bookingsCount,
}) => {
  const tabs: {
    key: AdminTabType;
    label: string;
    iconType: 'feather' | 'ion' | 'material';
    icon: string;
    count?: number;
    hasAlert?: boolean;
  }[] = [
    { key: 'dashboard', label: 'Metrics', iconType: 'feather', icon: 'activity' },
    {
      key: 'requests',
      label: 'Requests',
      iconType: 'feather',
      icon: 'inbox',
      count: pendingRequestsCount,
      hasAlert: pendingRequestsCount > 0,
    },
    { key: 'stations', label: `Stations (${stationsCount})`, iconType: 'material', icon: 'train' },
    { key: 'users', label: `Users (${usersCount})`, iconType: 'feather', icon: 'users' },
    { key: 'create-user', label: '+ Add User', iconType: 'feather', icon: 'user-plus' },
    { key: 'bookings', label: `Tickets (${bookingsCount})`, iconType: 'ion', icon: 'receipt-outline' },
  ];

  return (
    <View style={styles.navContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollPills}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <View style={{ position: 'relative', marginRight: 5 }}>
                {tab.iconType === 'feather' && (
                  <Feather
                    name={tab.icon as any}
                    size={13}
                    color={isActive ? '#ffffff' : '#94a3b8'}
                  />
                )}
                {tab.iconType === 'ion' && (
                  <Ionicons
                    name={tab.icon as any}
                    size={13}
                    color={isActive ? '#ffffff' : '#94a3b8'}
                  />
                )}
                {tab.iconType === 'material' && (
                  <MaterialIcons
                    name={tab.icon as any}
                    size={14}
                    color={isActive ? '#ffffff' : '#94a3b8'}
                  />
                )}

                {tab.hasAlert && (
                  <View style={styles.redPulseDot} />
                )}
              </View>

              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {tab.label}
              </Text>

              {tab.count !== undefined && tab.count > 0 && (
                <View style={[styles.badgePill, isActive && styles.badgePillActive]}>
                  <Text style={[styles.badgePillText, isActive && styles.badgePillTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#080e1a',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  scrollPills: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  pillActive: {
    backgroundColor: '#0066ff',
    borderColor: '#38bdf8',
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#94a3b8',
  },
  pillTextActive: {
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
  },
  redPulseDot: {
    position: 'absolute',
    top: -3,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#080e1a',
  },
  badgePill: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 5,
  },
  badgePillActive: {
    backgroundColor: '#ffffff',
  },
  badgePillText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  badgePillTextActive: {
    color: '#dc2626',
  },
});
