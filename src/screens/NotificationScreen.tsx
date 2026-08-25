import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppHeader, FocusAwareStatusBar } from '@/components/common';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { FirebaseService } from '@/services';
import { AppAlert } from '@/context/AlertContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAtMillis?: number;
  createdAt?: any;
  createdAtStr?: string;
  timestamp?: string;
  type?: string;
  unread?: boolean;
}

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Entrance slide from right (width -> 0) + subtle fade (0 -> 1)
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleBack = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  }, [translateX, opacity, width, navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const onBackPress = () => {
      if (selectedNotif) {
        setSelectedNotif(null);
        return true;
      }
      handleBack();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    let unsub: (() => void) | null = null;
    if (user?.uid) {
      unsub = FirebaseService.listenToUserNotifications(user.uid, isAdmin, (list) => {
        // Ensure strictly sorted descending by time (newest on top)
        const sorted = [...list].sort((a, b) => {
          const timeA = a.createdAtMillis || (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const timeB = b.createdAtMillis || (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return timeB - timeA;
        });
        setNotifications(sorted);
      });
    }

    return () => {
      backSub.remove();
      if (unsub) unsub();
    };
  }, [user?.uid, isAdmin, selectedNotif, handleBack]);

  const confirmDeleteNotification = async () => {
    if (!selectedNotif) return;
    const notifId = selectedNotif.id;
    setDeleting(true);
    try {
      if (notifId && !notifId.startsWith('default_')) {
        await FirebaseService.deleteNotification(notifId);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      setSelectedNotif(null);
    } catch (err: any) {
      console.warn('Error deleting notification:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.rootOverlay}>
      <FocusAwareStatusBar backgroundColor="#0066ff" barStyle="light-content" />

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* ─── Blue Header (Clean without any delete icon) ────────────── */}
          <AppHeader
            title="Notifications"
            variant="blue"
            onBack={handleBack}
          />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={38} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySub}>
                  You're all caught up! Updates about your tickets, wallet recharges, and alerts will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <View key={`notif-${item.id}`} style={styles.notificationItem}>
                  {/* Header Row */}
                  <View style={styles.itemHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <Ionicons
                        name={
                          item.type === 'recharge_approved'
                            ? 'checkmark-circle'
                            : item.type === 'recharge_request'
                            ? 'card'
                            : item.type === 'recharge_rejected'
                            ? 'close-circle'
                            : 'notifications'
                        }
                        size={17}
                        color={
                          item.type === 'recharge_approved'
                            ? '#16a34a'
                            : item.type === 'recharge_rejected'
                            ? '#dc2626'
                            : '#0066ff'
                        }
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>

                    {/* 3 Dots Options Button */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.dotsBtn}
                      onPress={() => setSelectedNotif(item)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  {/* Message Body */}
                  <Text style={styles.itemMessage}>{item.message}</Text>

                  {/* Timestamp */}
                  <Text style={styles.itemTimestamp}>
                    {item.createdAtStr || item.timestamp || 'Recent'}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* ─── 3 DOTS OPTIONS MODAL / ACTION SHEET ─────────────────── */}
      {selectedNotif && (
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedNotif(null)}
          />

          <View style={styles.actionSheetBox}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconCircle}>
                <Ionicons name="notifications-outline" size={20} color="#0066ff" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedNotif.title}
                </Text>
                <Text style={styles.sheetSub} numberOfLines={1}>
                  {selectedNotif.createdAtStr || selectedNotif.timestamp || 'Recent notification'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setSelectedNotif(null)}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <Text style={styles.sheetPreviewText} numberOfLines={2}>
                "{selectedNotif.message}"
              </Text>
            </View>

            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={styles.sheetDeleteBtn}
                onPress={confirmDeleteNotification}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.sheetDeleteBtnText}>
                  {deleting ? 'Deleting...' : 'Delete Notification'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setSelectedNotif(null)}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 9999,
    elevation: 10,
  },
  animatedContainer: {
    flex: 1,
    backgroundColor: '#0066ff',
    width: '100%',
    height: '100%',
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0066ff',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 10,
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
  dotsBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
  },
  actionSheetOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 100000,
    elevation: 20,
  },
  actionSheetBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 25,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 14.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  sheetSub: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 1,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetBody: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sheetPreviewText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sheetActionsRow: {
    gap: 8,
  },
  sheetDeleteBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sheetDeleteBtnText: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  sheetCancelBtn: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  sheetCancelBtnText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
});
