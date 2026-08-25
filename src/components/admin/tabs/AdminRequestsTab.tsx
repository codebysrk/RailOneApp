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

interface AdminRequestsTabProps {
  rechargeRequests: any[];
  filteredRequests: any[];
  requestSearchQuery: string;
  setRequestSearchQuery: (val: string) => void;
  requestStatusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  setRequestStatusFilter: (val: 'all' | 'pending' | 'approved' | 'rejected') => void;
  loadingRequests: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  approvingRequestId: string | null;
  rejectingRequestId: string | null;
  onApproveRequest: (req: any) => void;
  onRejectRequest: (req: any) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export const AdminRequestsTab: React.FC<AdminRequestsTabProps> = ({
  rechargeRequests,
  filteredRequests,
  requestSearchQuery,
  setRequestSearchQuery,
  requestStatusFilter,
  setRequestStatusFilter,
  loadingRequests,
  refreshing,
  onRefresh,
  approvingRequestId,
  rejectingRequestId,
  onApproveRequest,
  onRejectRequest,
  triggerHaptic,
}) => {
  const keyExtractor = React.useCallback((item: any) => item.id, []);

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const isPending = item.status === 'pending';
      const isApproved = item.status === 'approved';
      const isRejected = item.status === 'rejected';

      return (
        <View
          style={[
            styles.card,
            isPending && styles.cardPending,
          ]}
        >
          {/* Top Info Header */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.avatarBox,
                {
                  backgroundColor: isPending
                    ? '#fef3c7'
                    : isApproved
                      ? '#dcfce7'
                      : '#fee2e2',
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: isPending
                      ? '#b45309'
                      : isApproved
                        ? '#15803d'
                        : '#b91c1c',
                  },
                ]}
              >
                {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {item.userName || 'Passenger'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isPending && { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                    isApproved && { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                    isRejected && { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isPending && { color: '#b45309' },
                      isApproved && { color: '#15803d' },
                      isRejected && { color: '#b91c1c' },
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.userMeta} numberOfLines={1}>
                {item.userEmail || item.userId?.substring(0, 10)}{' '}
                {item.userMobile ? `• ${item.userMobile}` : ''}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountNum}>
                +₹{item.amount.toFixed(2)}
              </Text>
              <Text style={styles.amountLabel}>REQUEST</Text>
            </View>
          </View>

          {/* Details Row */}
          <View style={styles.cardMetaRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="hash" size={10.5} color="#94a3b8" style={{ marginRight: 2 }} />
              <Text style={styles.metaId} numberOfLines={1}>
                {item.id ? item.id.substring(0, 14) : 'REF-N/A'}
              </Text>
            </View>

            <Text style={styles.metaTime}>
              {item.createdAt?.toDate
                ? item.createdAt.toDate().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now'}
            </Text>
          </View>

          {/* Action Row for Pending Requests */}
          {isPending && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => onApproveRequest(item)}
                disabled={approvingRequestId === item.id || rejectingRequestId === item.id}
                activeOpacity={0.85}
              >
                {approvingRequestId === item.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Feather name="check" size={14} color="#ffffff" style={{ marginRight: 5 }} />
                    <Text style={styles.approveBtnText}>
                      Approve & Credit ₹{item.amount}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => onRejectRequest(item)}
                disabled={approvingRequestId === item.id || rejectingRequestId === item.id}
                activeOpacity={0.85}
              >
                {rejectingRequestId === item.id ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Feather name="x" size={14} color="#dc2626" style={{ marginRight: 3 }} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [approvingRequestId, rejectingRequestId, onApproveRequest, onRejectRequest]
  );

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests by name, email, mobile, ID..."
          placeholderTextColor="#94a3b8"
          value={requestSearchQuery}
          onChangeText={setRequestSearchQuery}
          autoCapitalize="none"
          multiline={false}
        />
        {requestSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setRequestSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Status Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {[
          { id: 'all', label: `All (${rechargeRequests.length})` },
          {
            id: 'pending',
            label: `Pending (${rechargeRequests.filter((r) => r.status === 'pending').length})`,
          },
          {
            id: 'approved',
            label: `Approved (${rechargeRequests.filter((r) => r.status === 'approved').length})`,
          },
          {
            id: 'rejected',
            label: `Rejected (${rechargeRequests.filter((r) => r.status === 'rejected').length})`,
          },
        ].map((chip) => {
          const isActive = requestStatusFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chipBtn, isActive && styles.chipBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setRequestStatusFilter(chip.id as any);
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

      {loadingRequests ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0066ff" />
          <Text style={styles.centerText}>Loading recharge requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
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
              <View style={styles.emptyIconCircle}>
                <Ionicons name="card-outline" size={32} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No recharge requests found</Text>
              <Text style={styles.emptySubtitle}>
                Passenger wallet recharge requests will appear here for admin review and approval.
              </Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 40,
    marginBottom: 8,
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPending: {
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  userName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  userMeta: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  amountNum: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#16a34a',
  },
  amountLabel: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaId: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
  },
  metaTime: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  approveBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  approveBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  rejectBtn: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#dc2626',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
  emptySubtitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
  },
});
