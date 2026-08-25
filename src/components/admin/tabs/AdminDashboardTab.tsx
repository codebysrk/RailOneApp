import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminTabType } from '../AdminTabsNav';

interface AdminDashboardTabProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    disabledUsers: number;
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  };
  pendingRequestsCount: number;
  deletedLogsCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  setActiveTab: (tab: AdminTabType) => void;
  onOpenDeletedLogs: () => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  stats,
  pendingRequestsCount,
  deletedLogsCount,
  refreshing,
  onRefresh,
  setActiveTab,
  onOpenDeletedLogs,
  triggerHaptic,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Section Title: Quick Command Hub ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <Text style={styles.sectionSub}>System shortcuts & operations</Text>
      </View>

      {/* 6 Quick Action Grid Cards */}
      <View style={styles.grid}>
        {/* Requests Action */}
        <TouchableOpacity
          style={[styles.actionCard, pendingRequestsCount > 0 && styles.actionCardHighlighted]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('requests');
          }}
          activeOpacity={0.8}
        >
          {pendingRequestsCount > 0 && (
            <View style={styles.cardFloatingBadge}>
              <Text style={styles.cardFloatingBadgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="card" size={17} color="#d97706" />
          </View>
          <Text style={styles.cardTitle}>Recharge Reqs</Text>
          <Text style={styles.cardDesc}>
            {pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending Action` : 'Approve wallet funds'}
          </Text>
        </TouchableOpacity>

        {/* Stations Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('stations');
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
            <MaterialIcons name="train" size={18} color="#15803d" />
          </View>
          <Text style={styles.cardTitle}>Stations DB</Text>
          <Text style={styles.cardDesc}>Sync & manage stations</Text>
        </TouchableOpacity>

        {/* Add User Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('create-user');
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
            <Feather name="user-plus" size={17} color="#0066ff" />
          </View>
          <Text style={styles.cardTitle}>Add Account</Text>
          <Text style={styles.cardDesc}>Provision user credentials</Text>
        </TouchableOpacity>

        {/* Top-Up Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('users');
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="wallet" size={17} color="#16a34a" />
          </View>
          <Text style={styles.cardTitle}>R-Wallet</Text>
          <Text style={styles.cardDesc}>Credit passenger balances</Text>
        </TouchableOpacity>

        {/* Tickets Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('bookings');
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#faf5ff' }]}>
            <Ionicons name="receipt" size={17} color="#9333ea" />
          </View>
          <Text style={styles.cardTitle}>All Tickets</Text>
          <Text style={styles.cardDesc}>Edit distance & review</Text>
        </TouchableOpacity>

        {/* Deleted Logs Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            triggerHaptic('light');
            onOpenDeletedLogs();
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
            <Feather name="trash-2" size={17} color="#dc2626" />
          </View>
          <Text style={styles.cardTitle}>Audit Logs</Text>
          <Text style={styles.cardDesc}>{deletedLogsCount} Deleted Records</Text>
        </TouchableOpacity>
      </View>

      {/* ── Section Title: System Health & Breakdown ── */}
      <View style={[styles.sectionHeader, { marginTop: 6 }]}>
        <Text style={styles.sectionTitle}>SYSTEM OVERVIEW</Text>
        <Text style={styles.sectionSub}>Live passenger & booking breakdown</Text>
      </View>

      {/* Overview Stat Cards */}
      <View style={styles.breakdownRow}>
        {/* Passengers Breakdown */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.miniDot, { backgroundColor: '#0066ff' }]} />
              <Text style={styles.overviewLabel}>PASSENGERS</Text>
            </View>
            <Feather name="users" size={14} color="#0066ff" />
          </View>
          <Text style={styles.overviewNum}>{stats.totalUsers}</Text>
          <View style={styles.pillsRow}>
            <View style={[styles.statusPill, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.statusPillText, { color: '#15803d' }]}>
                {stats.activeUsers} Active
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.statusPillText, { color: '#b91c1c' }]}>
                {stats.disabledUsers} Blocked
              </Text>
            </View>
          </View>
        </View>

        {/* Bookings Breakdown */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.miniDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.overviewLabel}>BOOKINGS</Text>
            </View>
            <Ionicons name="ticket-outline" size={15} color="#16a34a" />
          </View>
          <Text style={styles.overviewNum}>{stats.totalBookings}</Text>
          <View style={styles.pillsRow}>
            <View style={[styles.statusPill, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.statusPillText, { color: '#b45309' }]}>
                {stats.upcomingBookings} Upcoming
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: '#ffe4e6' }]}>
              <Text style={[styles.statusPillText, { color: '#be123c' }]}>
                {stats.cancelledBookings} Cancelled
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security Audit Banner */}
      <TouchableOpacity
        style={styles.auditBanner}
        onPress={() => {
          triggerHaptic('light');
          onOpenDeletedLogs();
        }}
        activeOpacity={0.82}
      >
        <View style={styles.auditIconBox}>
          <MaterialCommunityIcons name="shield-account" size={22} color="#0066ff" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.auditTitle}>Deleted Users Audit Logs</Text>
            <View style={styles.auditCountBadge}>
              <Text style={styles.auditCountText}>{deletedLogsCount}</Text>
            </View>
          </View>
          <Text style={styles.auditSub}>
            Inspect wiped user profiles & copy Firebase Auth UIDs.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color="#94a3b8" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 14,
    paddingBottom: 28,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionCard: {
    width: '31.8%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  actionCardHighlighted: {
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
  },
  cardFloatingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cardFloatingBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 8,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1.5,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  overviewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  overviewLabel: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  overviewNum: {
    fontSize: 18,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0f172a',
    marginVertical: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
  },
  auditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  auditIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditTitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  auditCountBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginLeft: 6,
  },
  auditCountText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#475569',
  },
  auditSub: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 2,
  },
});
