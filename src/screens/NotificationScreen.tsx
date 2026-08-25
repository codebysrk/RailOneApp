import React, { useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, FocusAwareStatusBar } from '@/components/common';
import { colors } from '@/theme/colors';

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
  const { width } = useWindowDimensions();

  // Entrance slide from right (width -> 0) + subtle fade (0 -> 1)
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
    return () => backSub.remove();
  }, [width]);

  const handleBack = () => {
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
          {/* ─── Blue Header ────────────────────────────────────────────── */}
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
            {mockNotifications.map((item) => (
              <View key={`notif-${item.id}`} style={styles.notificationItem}>
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
      </Animated.View>
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
});
