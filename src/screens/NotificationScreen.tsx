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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, FocusAwareStatusBar } from '@/components/common';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { FirebaseService } from '@/services';

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
  const [lastDeletedNotif, setLastDeletedNotif] = useState<NotificationItem | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const undoTimeoutRef = useRef<any>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Entrance slide from right (width -> 0) + subtle fade (0 -> 1)
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Snackbar animation
  const snackbarAnim = useRef(new Animated.Value(0)).current;

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

  const commitPendingDelete = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    const idToDelete = pendingDeleteIdRef.current;
    if (idToDelete) {
      pendingDeleteIdRef.current = null;
      FirebaseService.deleteNotification(idToDelete).catch((err) => {
        console.warn('Error deleting notification:', err);
      });
    }
  }, []);

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
      handleBack();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    let unsub: (() => void) | null = null;
    if (user?.uid) {
      unsub = FirebaseService.listenToUserNotifications(user.uid, isAdmin, (list) => {
        // Ensure strictly sorted descending by time (newest on top) and exclude pending deleted item
        const sorted = [...list]
          .filter((item) => item.id !== pendingDeleteIdRef.current)
          .sort((a, b) => {
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
      commitPendingDelete();
    };
  }, [user?.uid, isAdmin, handleBack, commitPendingDelete]);

  const triggerSnackbar = () => {
    setShowUndoSnackbar(true);
    Animated.timing(snackbarAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      hideSnackbar();
    }, 4500);
  };

  const hideSnackbar = () => {
    Animated.timing(snackbarAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowUndoSnackbar(false);
      setLastDeletedNotif(null);
      commitPendingDelete();
    });
  };

  const handleDeleteNotification = () => {
    if (!selectedNotif) return;
    const itemToDelete = selectedNotif;
    const notifId = itemToDelete.id;

    // Commit any previous pending delete immediately
    commitPendingDelete();

    // Close bottom sheet
    setSelectedNotif(null);

    // Track for undo & optimistic delete
    pendingDeleteIdRef.current = notifId;
    setLastDeletedNotif(itemToDelete);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));

    // Show undo snackbar
    triggerSnackbar();
  };

  const handleUndo = () => {
    if (!lastDeletedNotif) {
      hideSnackbar();
      return;
    }
    // Cancel the pending deletion from Firebase
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    pendingDeleteIdRef.current = null;

    const restored = lastDeletedNotif;
    setNotifications((prev) => [restored, ...prev]);

    Animated.timing(snackbarAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowUndoSnackbar(false);
      setLastDeletedNotif(null);
    });
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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header matching official app */}
          <AppHeader
            title="Notification"
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
                  {/* Header Row: Title & 3-Dots */}
                  <View style={styles.itemHeaderRow}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    {/* 3 Dots Options Button */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.dotsBtn}
                      onPress={() => setSelectedNotif(item)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={19} color="#64748b" />
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

          {/* ─── UNDO SNACKBAR (Official RailOne match) ───────────── */}
          {showUndoSnackbar && (
            <Animated.View
              style={[
                styles.snackbarContainer,
                {
                  opacity: snackbarAnim,
                  transform: [
                    {
                      translateY: snackbarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={hideSnackbar}
                style={styles.snackbarCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.snackbarText}>Notification deleted</Text>
              <TouchableOpacity
                style={styles.undoBtn}
                onPress={handleUndo}
                activeOpacity={0.8}
              >
                <Text style={styles.undoBtnText}>Undo</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      </Animated.View>

      {/* ─── 3-DOTS BOTTOM SHEET (Exact Official Match) ─────────── */}
      <Modal
        visible={Boolean(selectedNotif)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotif(null)}
        statusBarTranslucent
      >
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedNotif(null)}
          />

          {selectedNotif && (
            <View style={styles.actionSheetBox}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedNotif.title}
                </Text>
              </View>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={styles.sheetDeleteRow}
                onPress={handleDeleteNotification}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={22} color="#dc2626" style={styles.trashIcon} />
                <Text style={styles.sheetDeleteText}>Delete Notification</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
  },
  notificationItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#152546',
    letterSpacing: -0.2,
    flex: 1,
    paddingRight: 8,
  },
  dotsBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMessage: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: 'Montserrat_500Medium',
    color: '#475569',
  },
  itemTimestamp: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#94a3b8',
    marginTop: 8,
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

  // ─── ACTION SHEET (OFFICIAL RAILONE STYLE) ───────────────────
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingBottom: 36,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 30,
  },
  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#152546',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 18,
  },
  sheetDeleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  trashIcon: {
    marginRight: 14,
  },
  sheetDeleteText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0f172a',
  },

  // ─── BOTTOM SNACKBAR (OFFICIAL BLUE UNDO BAR) ────────────────
  snackbarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0066ff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  snackbarCloseBtn: {
    marginRight: 10,
  },
  snackbarText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  undoBtn: {
    borderWidth: 1.5,
    borderColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  undoBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
  },
});
