import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/common';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread?: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'RailOne Alert',
    message:
      'Due to scheduled maintenance, reserved ticket booking and user-related services will be unavailable from 23:50 hrs on 27 Apr 2026 to 02:00 hrs on 28 Apr 2026.',
    timestamp: 'Mon, 27 Apr 10:23 PM',
  },
];

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ─── Blue Header ────────────────────────────────────────────── */}
      <AppHeader
        title="Notification"
        variant="blue"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mockNotifications.map((item) => (
          <View key={item.id} style={styles.notificationItem}>
            {/* Header Row */}
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Message Body */}
            <Text style={styles.itemMessage}>{item.message}</Text>

            {/* Timestamp */}
            <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066ff',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  notificationItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    letterSpacing: 0.2,
  },
  itemMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    letterSpacing: 0.1,
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    fontWeight: '400',
  },
});

