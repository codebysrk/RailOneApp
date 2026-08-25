import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AdminUsersTabProps {
  filteredUsers: any[];
  deletedLogsCount: number;
  userSearchQuery: string;
  setUserSearchQuery: (val: string) => void;
  userRoleFilter: 'all' | 'active' | 'disabled' | 'admin' | 'user';
  setUserRoleFilter: (val: 'all' | 'active' | 'disabled' | 'admin' | 'user') => void;
  loadingUsers: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  userBookingCountMap: Map<string, number>;
  currentAdminUid?: string;
  statusUpdatingId: string | null;
  toppingUpId: string | null;
  deletingUserId: string | null;
  onOpenDeletedLogs: () => void;
  onSelectUserForTickets: (user: any) => void;
  onToggleUserStatus: (user: any) => void;
  onTopUpAmount: (user: any, amount: number) => void;
  onSelectUserForTopUp: (user: any) => void;
  onDeleteUser: (user: any) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  filteredUsers,
  deletedLogsCount,
  userSearchQuery,
  setUserSearchQuery,
  userRoleFilter,
  setUserRoleFilter,
  loadingUsers,
  refreshing,
  onRefresh,
  userBookingCountMap,
  currentAdminUid,
  statusUpdatingId,
  toppingUpId,
  deletingUserId,
  onOpenDeletedLogs,
  onSelectUserForTickets,
  onToggleUserStatus,
  onTopUpAmount,
  onSelectUserForTopUp,
  onDeleteUser,
  triggerHaptic,
}) => {
  const keyExtractor = React.useCallback((item: any) => item.id || item.uid, []);

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const isBlocked = item.status === 'disabled';
      const isAdmin = item.role === 'admin';
      const uid = item.id || item.uid;
      const ticketCount = userBookingCountMap.get(uid) || 0;
      const isCurrentAdmin = uid === currentAdminUid;

      return (
        <View style={[styles.card, isBlocked && styles.cardBlocked]}>
          {/* User Info Header (Tap to view user tickets) */}
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => onSelectUserForTickets(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.avatar, isAdmin ? styles.avatarAdmin : styles.avatarUser]}>
              <Text style={[styles.avatarText, isAdmin ? styles.avatarTextAdmin : styles.avatarTextUser]}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {item.name || item.displayName || 'Passenger'}
                </Text>
                <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                  <Text style={[styles.roleBadgeText, isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser]}>
                    {isAdmin ? 'ADMIN' : 'USER'}
                  </Text>
                </View>
              </View>
              <Text style={styles.userMeta} numberOfLines={1}>
                {item.email || 'No email'} {item.mobile ? `• ${item.mobile}` : ''}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.walletNum}>₹{(item.wallet || 0).toFixed(0)}</Text>
              <Text style={styles.walletLabel}>R-WALLET</Text>
            </View>
          </TouchableOpacity>

          {/* Action Footer */}
          <View style={styles.cardFooter}>
            {/* View Tickets Button */}
            <TouchableOpacity
              style={[
                styles.ticketsPill,
                ticketCount > 0 ? styles.ticketsPillActive : styles.ticketsPillEmpty,
              ]}
              onPress={() => onSelectUserForTickets(item)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="ticket"
                size={12}
                color={ticketCount > 0 ? '#0066ff' : '#94a3b8'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.ticketsPillText,
                  ticketCount > 0 ? styles.ticketsPillTextActive : styles.ticketsPillTextEmpty,
                ]}
              >
                {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
              </Text>
            </TouchableOpacity>

            {/* Actions Group */}
            <View style={styles.actionsGroup}>
              {/* Status Toggle */}
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  isBlocked ? styles.statusBtnUnblock : styles.statusBtnBlock,
                ]}
                onPress={() => onToggleUserStatus(item)}
                disabled={statusUpdatingId === uid}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isBlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={10.5}
                  color={isBlocked ? '#15803d' : '#b91c1c'}
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.statusBtnText, isBlocked ? styles.statusBtnTextUnblock : styles.statusBtnTextBlock]}>
                  {isBlocked ? 'Unblock' : 'Block'}
                </Text>
              </TouchableOpacity>

              {/* Quick Top-Up Pills */}
              <TouchableOpacity
                style={styles.topUpPill}
                onPress={() => onTopUpAmount(item, 100)}
                disabled={toppingUpId === uid}
                activeOpacity={0.75}
              >
                <Text style={styles.topUpPillText}>+₹100</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topUpPill}
                onPress={() => onTopUpAmount(item, 500)}
                disabled={toppingUpId === uid}
                activeOpacity={0.75}
              >
                <Text style={styles.topUpPillText}>+₹500</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customTopUpBtn}
                onPress={() => onSelectUserForTopUp(item)}
                activeOpacity={0.75}
              >
                <Ionicons name="add" size={14} color="#475569" />
              </TouchableOpacity>

              {/* Delete User */}
              {!isCurrentAdmin && (
                <TouchableOpacity
                  style={styles.deleteUserBtn}
                  onPress={() => onDeleteUser(item)}
                  disabled={deletingUserId === uid}
                  activeOpacity={0.75}
                >
                  {deletingUserId === uid ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Feather name="trash-2" size={11.5} color="#dc2626" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [
      userBookingCountMap,
      currentAdminUid,
      statusUpdatingId,
      toppingUpId,
      deletingUserId,
      onSelectUserForTickets,
      onToggleUserStatus,
      onTopUpAmount,
      onSelectUserForTopUp,
      onDeleteUser,
    ]
  );

  return (
    <View style={styles.container}>
      {/* Search Bar & Logs Link */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, mobile, email..."
            placeholderTextColor="#94a3b8"
            value={userSearchQuery}
            onChangeText={setUserSearchQuery}
            autoCapitalize="none"
            multiline={false}
          />
          {userSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setUserSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.logsBtn}
          onPress={onOpenDeletedLogs}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={13} color="#b91c1c" style={{ marginRight: 4 }} />
          <Text style={styles.logsBtnText}>Logs ({deletedLogsCount})</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Horizontal Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {[
          { id: 'all', label: 'All Users' },
          { id: 'active', label: 'Active' },
          { id: 'disabled', label: 'Blocked' },
          { id: 'admin', label: 'Admins' },
          { id: 'user', label: 'Passengers' },
        ].map((chip) => {
          const isActive = userRoleFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chipBtn, isActive && styles.chipBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setUserRoleFilter(chip.id as any);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipBtnText, isActive && styles.chipBtnTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loadingUsers ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0066ff" />
          <Text style={styles.centerText}>Loading accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Feather name="users" size={32} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No matching users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 38,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  logsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginLeft: 6,
  },
  logsBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#b91c1c',
  },
  chipsScroll: {
    maxHeight: 34,
    marginBottom: 10,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
    justifyContent: 'center',
  },
  chipBtnActive: {
    backgroundColor: '#0066ff',
    borderColor: '#0066ff',
  },
  chipBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
  },
  chipBtnTextActive: {
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardBlocked: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: {
    backgroundColor: '#eff6ff',
  },
  avatarAdmin: {
    backgroundColor: '#fef3c7',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  avatarTextUser: {
    color: '#0066ff',
  },
  avatarTextAdmin: {
    color: '#b45309',
  },
  userName: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginRight: 6,
  },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeUser: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  roleBadgeAdmin: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  roleBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  roleBadgeTextUser: {
    color: '#0066ff',
  },
  roleBadgeTextAdmin: {
    color: '#b45309',
  },
  userMeta: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  walletNum: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#059669',
  },
  walletLabel: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 4,
  },
  ticketsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  ticketsPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  ticketsPillEmpty: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  ticketsPillText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
  },
  ticketsPillTextActive: {
    color: '#0066ff',
  },
  ticketsPillTextEmpty: {
    color: '#94a3b8',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusBtnBlock: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  statusBtnUnblock: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  statusBtnText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
  },
  statusBtnTextBlock: {
    color: '#b91c1c',
  },
  statusBtnTextUnblock: {
    color: '#15803d',
  },
  topUpPill: {
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: 5,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  topUpPillText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#16a34a',
  },
  customTopUpBtn: {
    paddingHorizontal: 5,
    paddingVertical: 3.5,
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteUserBtn: {
    padding: 4,
    backgroundColor: '#fef2f2',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  centerText: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
});
