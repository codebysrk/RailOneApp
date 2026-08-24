import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/context/NetworkContext';

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetwork();
  const isOffline = isConnected === false || isInternetReachable === false;
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnlineRestored, setShowOnlineRestored] = useState(false);
  
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowOnlineRestored(false);
      // Slide Down
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasOffline) {
      // Just came back online!
      setShowOnlineRestored(true);
      const timer = setTimeout(() => {
        // Slide Up after 2.5s
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setWasOffline(false);
          setShowOnlineRestored(false);
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline, translateY, opacity]);

  if (!isOffline && !showOnlineRestored) {
    return null;
  }

  const isRestored = !isOffline && showOnlineRestored;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.pill, isRestored ? styles.pillOnline : styles.pillOffline]}>
        <Ionicons
          name={isRestored ? 'checkmark-circle' : 'cloud-offline'}
          size={16}
          color="#ffffff"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {isRestored
            ? 'Back Online • Live Sync Active'
            : 'Offline Mode • Showing Saved Tickets'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  pillOffline: {
    backgroundColor: '#dc2626', // Vibrant Red/Crimson
  },
  pillOnline: {
    backgroundColor: '#16a34a', // Emerald Green
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11.5,
    color: '#ffffff',
    letterSpacing: 0.1,
  },
});
