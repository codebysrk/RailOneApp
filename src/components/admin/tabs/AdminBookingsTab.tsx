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

interface AdminBookingsTabProps {
  allBookings: any[];
  filteredBookings: any[];
  bookingSearchQuery: string;
  setBookingSearchQuery: (val: string) => void;
  usersList: any[];
  userBookingCountMap: Map<string, number>;
  selectedUserFilterId: string | 'all';
  setSelectedUserFilterId: (val: string | 'all') => void;
  bookingStatusFilter: 'all' | 'upcoming' | 'completed' | 'cancelled';
  setBookingStatusFilter: (val: 'all' | 'upcoming' | 'completed' | 'cancelled') => void;
  loadingBookings: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  userMap: Map<string, any>;
  onOpenEditDistance: (booking: any) => void;
  onSelectUserForTickets: (user: any) => void;
  onCancelTicket: (booking: any) => void;
  onDeleteBooking: (booking: any) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export const AdminBookingsTab: React.FC<AdminBookingsTabProps> = ({
  allBookings,
  filteredBookings,
  bookingSearchQuery,
  setBookingSearchQuery,
  usersList,
  userBookingCountMap,
  selectedUserFilterId,
  setSelectedUserFilterId,
  bookingStatusFilter,
  setBookingStatusFilter,
  loadingBookings,
  refreshing,
  onRefresh,
  userMap,
  onOpenEditDistance,
  onSelectUserForTickets,
  onCancelTicket,
  onDeleteBooking,
  triggerHaptic,
}) => {
  const keyExtractor = React.useCallback(
    (item: any) => item.id || item.bookingId || item.ticketId || item.pnr,
    []
  );

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const passenger = userMap.get(item.userId);
      const isUpcoming = item.status === 'upcoming';
      const isCompleted = item.status === 'completed';
      const isCancelled = item.status === 'cancelled';

      return (
        <View style={styles.ticketCard}>
          {/* Header Row */}
          <View style={styles.ticketHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.utsTag}>
                <Text style={styles.utsTagText}>
                  UTS: {item.ticketId || item.pnr || 'XMSQEB'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isUpcoming && { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                  isCompleted && { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
                  isCancelled && { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isUpcoming && { color: '#b45309' },
                    isCompleted && { color: '#15803d' },
                    isCancelled && { color: '#be123c' },
                  ]}
                >
                  {(item.status || 'upcoming').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.fareText}>₹{item.fare}</Text>
          </View>

          {/* Route Row with Inline Distance Edit */}
          <View style={styles.routeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationText} numberOfLines={1}>
                {item.sourceName || item.source || item.sourceCode || 'Source'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.distanceBadge}
              onPress={() => onOpenEditDistance(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.distanceText}>{item.distance || 'Set km'}</Text>
                <Feather name="edit-2" size={9} color="#0066ff" style={{ marginLeft: 3 }} />
              </View>
              <View style={styles.routeLineRow}>
                <View style={styles.line} />
                <Ionicons name="arrow-forward" size={12} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.stationText, { textAlign: 'right' }]} numberOfLines={1}>
                {item.destName || item.dest || item.destCode || 'Destination'}
              </Text>
            </View>
          </View>

          {/* Passenger Link & Date */}
          <View style={styles.passengerRow}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                if (passenger) {
                  onSelectUserForTickets(passenger);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle" size={15} color="#0066ff" style={{ marginRight: 4 }} />
              <Text style={styles.passengerLink}>
                {passenger?.name || passenger?.displayName || item.userId?.substring(0, 10) || 'Passenger'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={11} color="#64748b" style={{ marginRight: 3 }} />
              <Text style={styles.dateText}>
                {item.date || item.journeyDate || '---'}
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.ticketFooter}>
            <Text style={styles.classText}>
              {item.passengers || '1 Adult'} • {item.classType || 'Second Sitting'}
            </Text>

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
                style={styles.deleteBtn}
                onPress={() => onDeleteBooking(item)}
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
    [userMap, onOpenEditDistance, onSelectUserForTickets, onCancelTicket, onDeleteBooking]
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by PNR, UTS, route, passenger name..."
          placeholderTextColor="#94a3b8"
          value={bookingSearchQuery}
          onChangeText={setBookingSearchQuery}
          autoCapitalize="none"
          multiline={false}
        />
        {bookingSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setBookingSearchQuery('')}>
            <Ionicons name="close-circle" size={15} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Active User Filter Badge (If Filtered from Users Tab or Selection) */}
      {selectedUserFilterId !== 'all' && (
        <View style={styles.activeUserFilterBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="person-circle" size={15} color="#0066ff" style={{ marginRight: 5 }} />
            <Text style={styles.activeUserFilterLabel}>
              Filtered by Passenger:{' '}
              <Text style={styles.activeUserFilterName}>
                {userMap.get(selectedUserFilterId)?.name || 'User'}
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.clearUserFilterBtn}
            onPress={() => {
              triggerHaptic('light');
              setSelectedUserFilterId('all');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color="#0066ff" />
            <Text style={styles.clearUserFilterText}>Show All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {[
          { id: 'all', label: `All (${allBookings.length})` },
          { id: 'upcoming', label: `Upcoming (${allBookings.filter((b) => b.status === 'upcoming').length})` },
          { id: 'completed', label: `Completed (${allBookings.filter((b) => b.status === 'completed').length})` },
          { id: 'cancelled', label: `Cancelled (${allBookings.filter((b) => b.status === 'cancelled').length})` },
        ].map((chip) => {
          const isActive = bookingStatusFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chipBtn,
                isActive && styles.chipBtnActive,
              ]}
              onPress={() => {
                triggerHaptic('light');
                setBookingStatusFilter(chip.id as any);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipBtnText,
                  isActive && styles.chipBtnTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loadingBookings ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0066ff" />
          <Text style={styles.centerText}>Loading railway bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
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
              <Ionicons name="ticket-outline" size={36} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No bookings found</Text>
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
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 38,
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
  activeUserFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 8,
  },
  activeUserFilterLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#475569',
  },
  activeUserFilterName: {
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  clearUserFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  clearUserFilterText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
    marginLeft: 3,
  },
  chipsScroll: {
    maxHeight: 34,
    marginBottom: 8,
  },
  chipBtn: {
    paddingHorizontal: 11,
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
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
  },
  chipBtnTextActive: {
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  utsTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  utsTagText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  fareText: {
    fontSize: 14,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0066ff',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 7,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stationText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#1e293b',
  },
  distanceBadge: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  distanceText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  routeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    width: 18,
    height: 1,
    backgroundColor: '#cbd5e1',
    marginRight: 2,
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  passengerLink: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  classText: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  cancelBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancelBtnText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#dc2626',
  },
  deleteBtn: {
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
