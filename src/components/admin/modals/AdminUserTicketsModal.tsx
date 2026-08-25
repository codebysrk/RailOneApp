import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AdminUserTicketsModalProps {
  visible: boolean;
  onClose: () => void;
  user: any | null;
  userTickets: any[];
  userTicketsSearch: string;
  setUserTicketsSearch: (val: string) => void;
  onOpenEditDistance: (ticket: any) => void;
  onCancelTicket: (ticket: any) => void;
  onDeleteTicket: (ticket: any) => void;
  onDeleteAllUserTickets: (user: any) => void;
  deletingAll?: boolean;
}

export const AdminUserTicketsModal: React.FC<AdminUserTicketsModalProps> = ({
  visible,
  onClose,
  user,
  userTickets,
  userTicketsSearch,
  setUserTicketsSearch,
  onOpenEditDistance,
  onCancelTicket,
  onDeleteTicket,
  onDeleteAllUserTickets,
  deletingAll = false,
}) => {
  if (!visible) return null;

  const keyExtractor = React.useCallback(
    (item: any) => item.id || item.bookingId || item.ticketId,
    []
  );

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const isUpcoming = item.status === 'upcoming';
      const isCompleted = item.status === 'completed';
      const isCancelled = item.status === 'cancelled';

      return (
        <View style={styles.ticketCard}>
          {/* Top Bar: UTS Code + Status Tag + Fare */}
          <View style={styles.ticketCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.utsPill}>
                <Text style={styles.utsPillText}>
                  UTS: {item.ticketId || item.pnr || 'XMSQEB'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusTag,
                  isUpcoming && { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                  isCompleted && { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                  isCancelled && { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    isUpcoming && { color: '#b45309' },
                    isCompleted && { color: '#15803d' },
                    isCancelled && { color: '#be123c' },
                  ]}
                >
                  {(item.status || 'upcoming').toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.fareNum}>₹{item.fare}</Text>
          </View>

          {/* Route Timeline Container */}
          <View style={styles.routeContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName} numberOfLines={1}>
                {item.sourceName || item.source || item.sourceCode || 'Source'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.distanceChip}
              onPress={() => onOpenEditDistance(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.distanceText}>{item.distance || 'Set km'}</Text>
                <Feather name="edit-2" size={8.5} color="#0066ff" style={{ marginLeft: 3 }} />
              </View>
              <View style={styles.arrowRow}>
                <View style={styles.arrowBar} />
                <Ionicons name="arrow-forward" size={11} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.stationName, { textAlign: 'right' }]} numberOfLines={1}>
                {item.destName || item.dest || item.destCode || 'Destination'}
              </Text>
            </View>
          </View>

          {/* Footer Row */}
          <View style={styles.ticketFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={11} color="#64748b" style={{ marginRight: 3 }} />
              <Text style={styles.metaText}>
                {item.date || item.journeyDate || '---'} • {item.passengers || '1 Adult'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isUpcoming && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => onCancelTicket(item)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteTicketBtn}
                onPress={() => onDeleteTicket(item)}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Feather name="trash-2" size={12} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [onOpenEditDistance, onCancelTicket, onDeleteTicket]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top User Profile Header */}
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || user?.displayName || 'Passenger'}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{userTickets.length} Tickets</Text>
                </View>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'No email'} {user?.mobile ? `• ${user.mobile}` : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Action Row: Delete All Button + Wallet Strip */}
          <View style={styles.actionStrip}>
            <View style={styles.walletPill}>
              <Text style={styles.walletPillLabel}>WALLET:</Text>
              <Text style={styles.walletPillVal}>₹{(user?.wallet || 0).toFixed(0)}</Text>
            </View>

            {userTickets.length > 0 && (
              <TouchableOpacity
                style={styles.deleteAllBtn}
                onPress={() => onDeleteAllUserTickets(user)}
                disabled={deletingAll}
                activeOpacity={0.8}
              >
                {deletingAll ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Feather name="trash-2" size={12} color="#dc2626" style={{ marginRight: 4 }} />
                    <Text style={styles.deleteAllBtnText}>Delete All ({userTickets.length})</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Search within user tickets */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by station, UTS code, date..."
              placeholderTextColor="#94a3b8"
              value={userTicketsSearch}
              onChangeText={setUserTicketsSearch}
              multiline={false}
            />
            {userTicketsSearch.length > 0 && (
              <TouchableOpacity onPress={() => setUserTicketsSearch('')}>
                <Ionicons name="close-circle" size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tickets FlatList */}
          <FlatList
            data={userTickets}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10, paddingTop: 4 }}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={5}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="ticket-outline" size={28} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No tickets found</Text>
                <Text style={styles.emptySubtitle}>
                  This user has no journey records matching your search.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0066ff',
  },
  userName: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginRight: 6,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  countBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0066ff',
  },
  userEmail: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  walletPillLabel: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#94a3b8',
    marginRight: 4,
    letterSpacing: 0.5,
  },
  walletPillVal: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#059669',
  },
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  deleteAllBtnText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#dc2626',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 36,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  ticketCard: {
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
  ticketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  utsPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  utsPillText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0f172a',
  },
  statusTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  fareNum: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0066ff',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 7,
    padding: 6,
  },
  stationName: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#1e293b',
  },
  distanceChip: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  distanceText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBar: {
    width: 18,
    height: 1,
    backgroundColor: '#cbd5e1',
    marginRight: 2,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  metaText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  cancelBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancelBtnText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#dc2626',
  },
  deleteTicketBtn: {
    padding: 3.5,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 240,
  },
});
