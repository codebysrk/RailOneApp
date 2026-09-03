import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

interface AdminHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  adminEmail?: string;
  stats: {
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
  };
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onBack,
  onRefresh,
  adminEmail,
  stats,
}) => {
  return (
    <View style={styles.headerWrapper}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#e2e8f0" />
        </TouchableOpacity>

        <View style={styles.centerMeta}>
          <View style={styles.badgePill}>
            <View style={styles.glowingDot} />
            <Text style={styles.badgeText}>COMMAND CENTER</Text>
          </View>
          <Text style={styles.emailText} numberOfLines={1}>
            {adminEmail || 'admin@railone.com'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.circleBtn, styles.syncBtn]}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="sync" size={16} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      {/* KPI Ribbon Strip */}
      <View style={styles.kpiContainer}>
        {/* Revenue */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardTop}>
            <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
            <View style={[styles.kpiIconBubble, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={{ fontSize: 10, color: '#10b981', fontFamily: 'Montserrat_700Bold' }}>₹</Text>
            </View>
          </View>
          <Text style={[styles.kpiNum, { color: '#34d399' }]}>
            ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        {/* Users */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardTop}>
            <Text style={styles.kpiLabel}>PASSENGERS</Text>
            <View style={[styles.kpiIconBubble, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Feather name="users" size={10} color="#38bdf8" />
            </View>
          </View>
          <Text style={[styles.kpiNum, { color: '#38bdf8' }]}>{stats.totalUsers}</Text>
        </View>

        {/* Bookings */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardTop}>
            <Text style={styles.kpiLabel}>BOOKINGS</Text>
            <View style={[styles.kpiIconBubble, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="receipt-outline" size={10} color="#c084fc" />
            </View>
          </View>
          <Text style={[styles.kpiNum, { color: '#c084fc' }]}>{stats.totalBookings}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#080e1a',
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131d31',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  syncBtn: {
    backgroundColor: '#0c2340',
    borderColor: '#0284c7',
  },
  centerMeta: {
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111e38',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  emailText: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 2,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiIconBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNum: {
    fontSize: 14.5,
    fontFamily: 'Montserrat_800ExtraBold',
    marginTop: 2,
  },
});
