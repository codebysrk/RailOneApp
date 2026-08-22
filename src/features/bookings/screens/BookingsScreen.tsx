import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing, elevation } from '../../../theme/spacing';
import { FirebaseService } from '../../../services/FirebaseService';
import { useAuth } from '../../../context/AuthContext';
import { AppHeader, TicketCard, TicketData } from '../../../components/common';

const completedTickets: TicketData[] = [
  { id: '3', pnr: '6835493350', train: '20423 (PATALKOT SF EXP)', date: 'Thu, 30 Jul 26', source: 'CHHINDWARA JN.', dest: 'GWALIOR JN.', duration: '12h:41m', status: 'completed' },
  { id: '4', pnr: '2841446468', train: '12280 (TAJ EXPRESS)', date: 'Sun, 9 Aug 26', source: 'HAZRAT NIZAMUDDIN JN', dest: 'MORENA', duration: '4h:10m', status: 'completed' },
];

export const BookingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'Upcoming' | 'Completed' | 'Cancelled' | 'All'>('Upcoming');
  const [upcomingList, setUpcomingList] = useState<TicketData[]>([]);
  const [allCompleted, setAllCompleted] = useState<TicketData[]>(completedTickets);

  useEffect(() => {
    if (!user?.uid) return;
    // Real-time Firestore listener for tickets
    const unsubscribe = FirebaseService.listenToTickets(user.uid, (snapshot: any) => {
      const tickets: TicketData[] = [];
      const completed: TicketData[] = [...completedTickets];
      snapshot.forEach((doc: any) => {
        const data = { id: doc.id, ...doc.data() } as TicketData;
        if (data.status === 'upcoming') tickets.push(data);
        else if (data.status === 'completed' || data.status === 'cancelled') completed.unshift(data);
      });
      setUpcomingList(tickets);
      setAllCompleted(completed);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const getFilterColor = (tab: string) => {
    if (filter !== tab) return '#94a3b8';
    switch (tab) {
      case 'Upcoming': return '#f59e0b';
      case 'Completed': return '#10b981';
      case 'Cancelled': return '#ef4444';
      default: return '#0066ff';
    }
  };

  const openTicket = (t: TicketData) => {
    navigation.navigate('Ticket', { ticket: t });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader
        title="My Bookings"
        variant="blue"
        onBack={() => navigation.navigate('HomeTab')}
        rightAction={{
          icon: 'swap-vertical',
          onPress: () => {},
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {(filter === 'Upcoming' || filter === 'All') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>Upcoming ({upcomingList.length})</Text>
              <Ionicons name="sync-outline" size={20} color="#64748b" />
            </View>
            {upcomingList.map((t, idx) => (
              <TicketCard
                key={`upcoming-${t.id}-${idx}`}
                ticket={t}
                status="upcoming"
                onOpen={() => openTicket(t)}
              />
            ))}
          </View>
        )}

        {(filter === 'Completed' || filter === 'All') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#10b981' }]}>Completed ({allCompleted.length})</Text>
              <Ionicons name="sync-outline" size={20} color="#64748b" />
            </View>
            {allCompleted.map((t, idx) => (
              <TicketCard
                key={`completed-${t.id}-${idx}`}
                ticket={t}
                status="completed"
                onOpen={() => openTicket(t)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Filter Bar */}
      <View style={styles.filterBarWrapper}>
        <View style={styles.filterBar}>
          {(['Upcoming', 'Completed', 'Cancelled', 'All'] as const).map((tab) => {
            const isSelected = filter === tab;
            const activeColor = getFilterColor(tab);
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setFilter(tab)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isSelected ? 'ticket' : 'ticket-outline'}
                  size={22}
                  color={isSelected ? activeColor : '#64748b'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isSelected ? activeColor : '#64748b',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: spacing.md, paddingBottom: 90 },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },

  filterBarWrapper: {
    backgroundColor: '#e6f3fd',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#d0e7fb',
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    ...elevation.sm,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
  },
  filterTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 11,
    marginTop: 4,
  },
});
